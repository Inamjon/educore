from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.audit import audit_log, audited
from common.permissions import HasModulePermission, is_platform_user, user_has_permission
from foundation.filters import AuditLogFilter, BranchFilter, OrganizationFilter, UserFilter
from foundation.models import AuditLog, Organization, Branch, Permission, Role, User
from foundation.serializers import (
    AuditLogSerializer,
    BranchSerializer,
    OrganizationSerializer,
    PermissionSerializer,
    RoleSerializer,
    UserSerializer,
)
from foundation.services import (
    PLATFORM_SETTINGS_DEFAULTS,
    PLATFORM_SETTINGS_VALIDATORS,
    get_platform_setting,
    set_platform_setting,
)

BYPASS_ALIAS = "auth_bypass_rls"  # see auth_custom/services/session_service.py — same role, same reason:
# PlatformBrandingView runs before any org context exists (no token at all).


class SoftDeleteDestroyMixin:
    """204-No-Content doesn't carry an envelope body — override destroy() so
    "delete" still returns the standard {success, message, data} shape, and
    so it actually soft-deletes (SoftDeleteMixin.delete() is not a real SQL
    DELETE) rather than relying on DRF's default hard-delete behavior.
    """

    entity_type = "unknown"

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"success": True, "message": f"{self.entity_type} deleted", "data": None})


class OrganizationViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [HasModulePermission]
    filterset_class = OrganizationFilter
    search_fields = ["name", "email", "city"]
    ordering_fields = ["name", "created_at", "status"]
    entity_type = "organization"
    permission_map = {
        "list": ("organizations", "view"),
        "retrieve": ("organizations", "view"),
        "create": ("organizations", "create"),
        "update": ("organizations", "update"),
        "partial_update": ("organizations", "update"),
        "destroy": ("organizations", "delete"),
        "suspend": ("organizations", "update"),
    }

    def get_queryset(self):
        """Organization has no tenant/RLS scoping — it IS the tenant root —
        so unlike every other ViewSet in this codebase, an explicit filter
        is needed here, not just a permission check: a center_admin's own
        `organizations:view` grant (for their org's Settings page) would
        otherwise return every organization on the platform. Only a
        platform user (super_admin) sees the full list, which is what the
        Super-Admin Centers page needs.
        """
        # select_related("subscription_plan") — OrganizationSerializer's
        # subscription_plan_detail nested field would otherwise issue one
        # extra query per row (N+1) on every list request.
        qs = Organization.objects.all().select_related("subscription_plan").order_by("-created_at")
        if is_platform_user(self.request.user):
            return qs
        return qs.filter(id=getattr(self.request.user, "organization_id", None))

    @audited(action="create", entity_type="organization")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="organization")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    @audited(action="update", entity_type="organization")
    def suspend(self, request, *args, **kwargs):
        org = self.get_object()
        org.status = "active" if org.status == "suspended" else "suspended"
        org.save(update_fields=["status"])
        return Response({"success": True, "message": f"Organization {org.status}", "data": OrganizationSerializer(org).data})


class BranchViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = Branch.objects.all().select_related("organization").order_by("-created_at")
    serializer_class = BranchSerializer
    permission_classes = [HasModulePermission]
    filterset_class = BranchFilter
    search_fields = ["name", "city"]
    entity_type = "branch"
    permission_map = {
        "list": ("branches", "view"),
        "retrieve": ("branches", "view"),
        "create": ("branches", "create"),
        "update": ("branches", "update"),
        "partial_update": ("branches", "update"),
        "destroy": ("branches", "delete"),
        "suspend": ("branches", "update"),
    }

    @audited(action="create", entity_type="branch")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="branch")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    @audited(action="update", entity_type="branch")
    def suspend(self, request, *args, **kwargs):
        branch = self.get_object()
        branch.is_active = not branch.is_active
        branch.save(update_fields=["is_active"])
        status_label = "activated" if branch.is_active else "suspended"
        return Response({"success": True, "message": f"Branch {status_label}", "data": BranchSerializer(branch).data})


class UserViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    """Administrators, teachers, students, parents — every foundation.User.
    The Super-Admin "Administrators" page filters via ?role=center_admin
    etc. (see UserFilter); student/teacher-specific profile data lives in
    their own future schemas, not here.
    """

    queryset = User.objects.all().select_related("organization", "branch").prefetch_related("user_roles__role")
    serializer_class = UserSerializer
    permission_classes = [HasModulePermission]
    filterset_class = UserFilter
    search_fields = ["first_name", "last_name", "phone", "login_id"]
    entity_type = "user"
    permission_map = {
        "list": ("administrators", "view"),
        "retrieve": ("administrators", "view"),
        "create": ("administrators", "create"),
        "update": ("administrators", "update"),
        "partial_update": ("administrators", "update"),
        "destroy": ("administrators", "delete"),
        "suspend": ("administrators", "update"),
    }

    # Fields a user without administrators:update may change on their OWN
    # record — everything else (role_ids, status, organization, branch, ...)
    # stays gated behind the real "administrators" permission even for
    # self-requests, so this never becomes a privilege-escalation path.
    SELF_EDITABLE_FIELDS = {"first_name", "last_name", "phone", "gender", "avatar_url", "password", "language"}

    def get_permissions(self):
        """Every non-admin portal (Teacher, Student, ...) needs to read and
        lightly edit its own logged-in user's record — e.g. the Teacher
        Profile page pre-filling name/phone — but has no administrators
        grant. Self-access on your own pk bypasses the module check
        entirely for retrieve; update/partial_update still go through
        perform_update's field allowlist below.
        """
        is_self = self.action in ("retrieve", "update", "partial_update") and str(
            self.kwargs.get("pk", "")
        ) == str(getattr(self.request.user, "id", ""))
        if is_self:
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_update(self, serializer):
        is_self = serializer.instance.id == self.request.user.id
        new_password = serializer.validated_data.get("password")
        if is_self:
            # Self-service password changes require proving the current
            # password regardless of the caller's RBAC grant — an
            # administrators:update permission is about editing OTHER
            # users' records (no old-password prompt makes sense there,
            # same as the Super-Admin Administrators page today), not a
            # license to silently rotate your own credential. Checked via
            # raw request.data since `current_password` isn't a real model
            # field and has no reason to be a serializer field.
            if new_password:
                current_password = self.request.data.get("current_password")
                if not current_password or not serializer.instance.check_password(current_password):
                    raise PermissionDenied("Current password is incorrect.")
            if not user_has_permission(self.request.user, "administrators", "update"):
                disallowed = set(serializer.validated_data) - self.SELF_EDITABLE_FIELDS
                if disallowed:
                    raise PermissionDenied(f"You can only update: {', '.join(sorted(self.SELF_EDITABLE_FIELDS))}.")
        serializer.save()
        if is_self and new_password:
            audit_log(self.request, action="update", entity_type="user", entity_id=str(serializer.instance.id), metadata={"field": "password"})

    @audited(action="create", entity_type="user")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="user")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    @audited(action="update", entity_type="user")
    def suspend(self, request, *args, **kwargs):
        user = self.get_object()
        user.status = "active" if user.status == "suspended" else "suspended"
        user.save(update_fields=["status"])
        return Response({"success": True, "message": f"User {user.status}", "data": UserSerializer(user).data})


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only for Phase 0 — roles/permissions are seeded, not managed
    through the API yet (no frontend surface for it either)."""

    queryset = Role.objects.filter(is_active=True).order_by("name")
    serializer_class = RoleSerializer
    permission_classes = [HasModulePermission]
    permission_map = {"list": ("roles", "view"), "retrieve": ("roles", "view")}


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all().order_by("module", "action")
    serializer_class = PermissionSerializer
    permission_classes = [HasModulePermission]
    permission_map = {"list": ("roles", "view"), "retrieve": ("roles", "view")}


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only, immutable/append-only by design (AuditLog is never
    updated or soft-deleted — see common/audit.py). RLS already scopes rows
    to the caller's own org (audit_logs is nullable_org=True in
    foundation/migrations/0004_rls.py, so org-less system rows are visible
    too); a super_admin's platform-user RLS bypass sees every org's rows,
    which is exactly what the Super-Admin Audit Logs page needs — no
    separate "platform view" query shape required, unlike Teachers/Students
    where the Admin portal's existing API functions needed an
    organizationId-optional mode added.
    """

    queryset = AuditLog.objects.all().select_related("organization", "user").order_by("-created_at")
    serializer_class = AuditLogSerializer
    permission_classes = [HasModulePermission]
    filterset_class = AuditLogFilter
    permission_map = {"list": ("audit_logs", "view"), "retrieve": ("audit_logs", "view")}


class PlatformSettingsView(APIView):
    """General + Security platform-wide config for the Super-Admin Settings
    page — see foundation.services' docstring on PLATFORM_SETTINGS_DEFAULTS
    for why these two panels live here as generic key-value Setting rows
    rather than a dedicated model. Theme/Languages/Email/SMS/Backup/API-Keys
    aren't wired yet (frontend mock only, see the plan doc) and have no
    backend surface at all — only "general"/"security" are ever read here.
    Plain APIView, not a ModelViewSet: this isn't a collection of rows, it's
    two singleton config blobs, so `user_has_permission` is checked
    directly rather than via HasModulePermission's action-keyed map (same
    style as payment_gateways.views.CheckoutInitiateView).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not user_has_permission(request.user, "platform_settings", "view"):
            raise PermissionDenied("You do not have permission to view platform settings.")
        return Response(
            {"success": True, "message": "", "data": {key: get_platform_setting(key) for key in PLATFORM_SETTINGS_DEFAULTS}}
        )

    @transaction.atomic
    def put(self, request):
        if not user_has_permission(request.user, "platform_settings", "update"):
            raise PermissionDenied("You do not have permission to update platform settings.")

        # Validated up front, before any write — a later key's bad payload
        # (or the DB write of an earlier key) must never leave a partial
        # save committed, hence @transaction.atomic wrapping the whole
        # method (a raised ValidationError rolls it back) rather than
        # writing key-by-key as each is checked.
        merged_by_key = {}
        for key in PLATFORM_SETTINGS_DEFAULTS:
            incoming = request.data.get(key)
            if incoming is None:
                continue
            if not isinstance(incoming, dict):
                raise ValidationError({key: "Must be an object."})
            # Real per-field validation, not just "is a dict" — this data
            # is read by LoginView's lockout check and
            # password_policy.validate_password_policy on every login/
            # password-set platform-wide, so a malformed value (e.g.
            # maxLoginAttempts as a string) must be rejected here, not
            # allowed to 500 those instead.
            PLATFORM_SETTINGS_VALIDATORS[key](incoming)
            # Merged into the current effective value (defaults + whatever's
            # stored), not replaced outright — a partial update from one
            # panel can't accidentally wipe fields it didn't send, while a
            # whole-panel Save (the actual frontend behavior today) still
            # works exactly the same since it sends every field anyway.
            merged_by_key[key] = {**get_platform_setting(key), **incoming}

        if not merged_by_key:
            raise ValidationError("Request body must include a 'general' and/or 'security' object.")

        updated = {}
        for key, merged in merged_by_key.items():
            setting = set_platform_setting(key, merged)
            updated[key] = merged
            # entity_id is a real UUIDField — the Setting row's own id, not
            # the panel key ("general"/"security", not a UUID at all); the
            # section name still goes in metadata for readability.
            audit_log(
                request, action="update", entity_type="platform_settings", entity_id=str(setting.id),
                new_values=merged, metadata={"section": key},
            )

        return Response({"success": True, "message": "Settings saved", "data": updated})


class PlatformBrandingView(APIView):
    """Public, unauthenticated — the login page needs the platform's name/
    tagline/logo *before* anyone is signed in. Safe by construction: only
    ever reads the "general" panel's already-public-facing fields. Goes
    through the BYPASSRLS alias, same reasoning as auth_custom.LoginView's
    own initial lookup — no token means no org context is ever established
    for this request (see common/middleware.py's docstring), and relying on
    `current_setting(..., true)` to cleanly resolve to NULL in that state
    proved unreliable in practice (a prior request's session-level GUC can
    still be visible), so this sidesteps RLS entirely rather than depend on
    it for a read that's already meant to be public.
    """

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get(self, request):
        general = get_platform_setting("general", using=BYPASS_ALIAS)
        return Response(
            {
                "success": True,
                "message": "",
                "data": {
                    "platformName": general["platformName"],
                    "tagline": general["tagline"],
                    "logoUrl": general["logoUrl"],
                    "faviconUrl": general["faviconUrl"],
                },
            }
        )
