from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from common.audit import audited
from common.permissions import HasModulePermission
from foundation.views import SoftDeleteDestroyMixin
from schedule.filters import LessonFilter
from schedule.models import Lesson
from schedule.serializers import LessonSerializer

LESSON_PERMISSION_MAP = {
    "list": ("schedule", "view"),
    "retrieve": ("schedule", "view"),
    "create": ("schedule", "create"),
    "update": ("schedule", "update"),
    "partial_update": ("schedule", "update"),
    "destroy": ("schedule", "delete"),
}


class LessonViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = (
        Lesson.objects.all()
        .select_related("group__course", "group__teacher__user")
        .order_by("date", "start_time")
    )
    serializer_class = LessonSerializer
    permission_classes = [HasModulePermission]
    filterset_class = LessonFilter
    entity_type = "lesson"
    permission_map = LESSON_PERMISSION_MAP

    def _check_owns_group(self, group):
        """Same ownership gap as AttendanceViewSet._check_owns_group — a
        teacher may only schedule/reschedule lessons for groups they teach;
        center admins (no linked teacher_profile) aren't restricted.
        """
        teacher_profile = getattr(self.request.user, "teacher_profile", None)
        if teacher_profile is not None and group.teacher_id != teacher_profile.id:
            raise PermissionDenied("You can only manage lessons for groups you teach.")

    def perform_create(self, serializer):
        self._check_owns_group(serializer.validated_data["group"])
        serializer.save()

    def perform_update(self, serializer):
        group = serializer.validated_data.get("group", serializer.instance.group)
        self._check_owns_group(group)
        serializer.save()

    @audited(action="create", entity_type="lesson")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="lesson")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
