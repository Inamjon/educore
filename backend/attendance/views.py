from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from attendance.filters import AttendanceFilter
from attendance.models import Attendance
from attendance.serializers import AttendanceSerializer
from common.audit import audited
from common.permissions import HasModulePermission
from foundation.views import SoftDeleteDestroyMixin

ATTENDANCE_PERMISSION_MAP = {
    "list": ("attendance", "view"),
    "retrieve": ("attendance", "view"),
    "create": ("attendance", "create"),
    "update": ("attendance", "update"),
    "partial_update": ("attendance", "update"),
    "destroy": ("attendance", "delete"),
}


class AttendanceViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = Attendance.objects.all().select_related("student_profile__user", "group__course").order_by("-date")
    serializer_class = AttendanceSerializer
    permission_classes = [HasModulePermission]
    filterset_class = AttendanceFilter
    entity_type = "attendance"
    permission_map = ATTENDANCE_PERMISSION_MAP

    def _check_owns_group(self, group):
        """A teacher may only mark attendance for groups they teach — center
        admins (no linked teacher_profile) aren't restricted. HasModulePermission
        only gates the module+action, not which group, so this fills the gap.
        """
        teacher_profile = getattr(self.request.user, "teacher_profile", None)
        if teacher_profile is not None and group.teacher_id != teacher_profile.id:
            raise PermissionDenied("You can only mark attendance for groups you teach.")

    def perform_create(self, serializer):
        self._check_owns_group(serializer.validated_data["group"])
        serializer.save()

    def perform_update(self, serializer):
        group = serializer.validated_data.get("group", serializer.instance.group)
        self._check_owns_group(group)
        serializer.save()

    @audited(action="create", entity_type="attendance")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="attendance")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
