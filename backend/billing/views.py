from django.db.models import Max
from rest_framework import viewsets

from billing.filters import SubscriptionPlanFilter
from billing.models import SubscriptionPlan
from billing.serializers import SubscriptionPlanSerializer
from common.audit import audited
from common.permissions import HasModulePermission
from foundation.views import SoftDeleteDestroyMixin

BILLING_PERMISSION_MAP = {
    "list": ("billing", "view"),
    "retrieve": ("billing", "view"),
    "create": ("billing", "create"),
    "update": ("billing", "update"),
    "partial_update": ("billing", "update"),
    "destroy": ("billing", "delete"),
}


class SubscriptionPlanViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    """Platform-wide catalog — no queryset scoping needed (unlike every
    tenant-data ViewSet in this codebase): `SubscriptionPlan` has no
    `organization` column and isn't RLS-covered, it's reference data every
    org can see. Read access isn't actually restricted to super_admin
    (`billing:view` isn't granted to any org role in
    `DEFAULT_ROLE_PERMISSIONS`, so a plain center_admin/teacher/student
    caller 403s the same as any other ungranted module) — write access is
    effectively super_admin-only for the same reason: no org role is ever
    granted `billing:create/update/delete`, and only a system-level role
    (super_admin) bypasses the grant requirement entirely (see
    `common.permissions.user_has_permission`'s platform-role bypass).
    """

    queryset = SubscriptionPlan.objects.all().order_by("display_order", "price")
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [HasModulePermission]
    filterset_class = SubscriptionPlanFilter
    search_fields = ["name", "slug"]
    entity_type = "subscription_plan"
    permission_map = BILLING_PERMISSION_MAP

    def perform_create(self, serializer):
        # The Subscriptions page's "Create Plan" form has no display_order
        # field — without a default here, every plan it creates lands at 0
        # and sorts intermixed with (or ahead of) existing tiers via
        # Meta.ordering = ["display_order", "price"]. Append after the
        # current highest instead, so a new plan shows up last by default;
        # an explicit display_order in the request (e.g. a future reorder
        # UI) still wins over this.
        if "display_order" not in serializer.validated_data:
            highest = SubscriptionPlan.objects.aggregate(Max("display_order"))["display_order__max"] or 0
            serializer.save(display_order=highest + 1)
        else:
            serializer.save()

    @audited(action="create", entity_type="subscription_plan")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="update", entity_type="subscription_plan")
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @audited(action="delete", entity_type="subscription_plan")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
