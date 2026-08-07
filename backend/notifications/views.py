from rest_framework import viewsets

from common.audit import audited
from common.permissions import HasModulePermission
from foundation.views import SoftDeleteDestroyMixin
from notifications.filters import NotificationFilter
from notifications.models import Notification
from notifications.serializers import NotificationSerializer

NOTIFICATION_PERMISSION_MAP = {
    "list": ("notifications", "view"),
    "retrieve": ("notifications", "view"),
    "create": ("notifications", "create"),
    "update": ("notifications", "update"),
    "partial_update": ("notifications", "update"),
    "destroy": ("notifications", "delete"),
}


class NotificationViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    """Always scoped to the caller's own inbox — there is no oversight mode
    here (unlike e.g. StudentProfileViewSet, which any `students:view`
    holder can browse in full). A notification only matters to the person it
    was sent to, and nothing in the mock UI this replaces ever showed
    someone else's notifications, so `get_queryset` filters to
    `recipient=request.user` for every action, not just list — that also
    means reaching for another user's notification 404s instead of 403ing,
    which leaks less (no confirmation the row even exists).
    """

    serializer_class = NotificationSerializer
    permission_classes = [HasModulePermission]
    filterset_class = NotificationFilter
    entity_type = "notification"
    permission_map = NOTIFICATION_PERMISSION_MAP

    def get_queryset(self):
        return (
            Notification.objects.all()
            .filter(recipient=self.request.user)
            .select_related("sender")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization, sender=self.request.user)

    @audited(action="delete", entity_type="notification")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
