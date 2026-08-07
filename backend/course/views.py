from rest_framework import viewsets

from common.audit import audited
from common.permissions import HasModulePermission
from course.filters import CourseFilter
from course.models import Course
from course.serializers import CourseSerializer
from foundation.views import SoftDeleteDestroyMixin

COURSE_PERMISSION_MAP = {
    "list": ("courses", "view"),
    "retrieve": ("courses", "view"),
    "create": ("courses", "create"),
    "update": ("courses", "update"),
    "partial_update": ("courses", "update"),
    "destroy": ("courses", "delete"),
}


class CourseViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = Course.objects.all().select_related("branch").order_by("-created_at")
    serializer_class = CourseSerializer
    permission_classes = [HasModulePermission]
    filterset_class = CourseFilter
    search_fields = ["name", "code", "category"]
    entity_type = "course"
    permission_map = COURSE_PERMISSION_MAP

    @audited(action="create", entity_type="course")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="course")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
