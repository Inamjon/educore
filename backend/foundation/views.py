from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.audit import audited
from common.permissions import HasModulePermission
from foundation.filters import BranchFilter, OrganizationFilter, UserFilter
from foundation.models import Organization, Branch, Permission, Role, User
from foundation.serializers import (
    BranchSerializer,
    OrganizationSerializer,
    PermissionSerializer,
    RoleSerializer,
    UserSerializer,
)


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
    queryset = Organization.objects.all().order_by("-created_at")
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
