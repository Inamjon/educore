from rest_framework import viewsets

from common.audit import audited
from common.permissions import HasModulePermission
from foundation.views import SoftDeleteDestroyMixin
from teacher.filters import (
    TeacherAvailabilityFilter,
    TeacherDocumentFilter,
    TeacherProfileFilter,
    TeacherSalaryFilter,
    TeacherSpecializationFilter,
)
from teacher.models import TeacherAvailability, TeacherDocument, TeacherProfile, TeacherSalary, TeacherSpecialization
from teacher.serializers import (
    TeacherAvailabilitySerializer,
    TeacherDocumentSerializer,
    TeacherProfileSerializer,
    TeacherSalarySerializer,
    TeacherSpecializationSerializer,
)

TEACHER_PERMISSION_MAP = {
    "list": ("teachers", "view"),
    "retrieve": ("teachers", "view"),
    "create": ("teachers", "create"),
    "update": ("teachers", "update"),
    "partial_update": ("teachers", "update"),
    "destroy": ("teachers", "delete"),
}


class TeacherProfileViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = TeacherProfile.objects.all().select_related("user", "branch").order_by("-created_at")
    serializer_class = TeacherProfileSerializer
    permission_classes = [HasModulePermission]
    filterset_class = TeacherProfileFilter
    search_fields = ["teacher_code", "user__first_name", "user__last_name", "user__login_id"]
    entity_type = "teacher_profile"
    permission_map = TEACHER_PERMISSION_MAP

    @audited(action="create", entity_type="teacher_profile")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="teacher_profile")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class TeacherSalaryViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = TeacherSalary.objects.all().select_related("teacher_profile").order_by("-effective_from")
    serializer_class = TeacherSalarySerializer
    permission_classes = [HasModulePermission]
    filterset_class = TeacherSalaryFilter
    entity_type = "teacher_salary"
    permission_map = TEACHER_PERMISSION_MAP


class TeacherAvailabilityViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = TeacherAvailability.objects.all().select_related("teacher_profile").order_by("day_of_week", "start_time")
    serializer_class = TeacherAvailabilitySerializer
    permission_classes = [HasModulePermission]
    filterset_class = TeacherAvailabilityFilter
    entity_type = "teacher_availability"
    permission_map = TEACHER_PERMISSION_MAP


class TeacherSpecializationViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = TeacherSpecialization.objects.all().select_related("teacher_profile").order_by("-is_primary", "subject_name")
    serializer_class = TeacherSpecializationSerializer
    permission_classes = [HasModulePermission]
    filterset_class = TeacherSpecializationFilter
    search_fields = ["subject_name"]
    entity_type = "teacher_specialization"
    permission_map = TEACHER_PERMISSION_MAP


class TeacherDocumentViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = TeacherDocument.objects.all().select_related("teacher_profile", "file").order_by("-created_at")
    serializer_class = TeacherDocumentSerializer
    permission_classes = [HasModulePermission]
    filterset_class = TeacherDocumentFilter
    search_fields = ["title", "document_number"]
    entity_type = "teacher_document"
    permission_map = TEACHER_PERMISSION_MAP
