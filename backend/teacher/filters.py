import django_filters

from teacher.models import TeacherAvailability, TeacherDocument, TeacherProfile, TeacherSalary, TeacherSpecialization


class TeacherProfileFilter(django_filters.FilterSet):
    class Meta:
        model = TeacherProfile
        fields = ["organization", "branch", "status", "employment_type"]


class TeacherSalaryFilter(django_filters.FilterSet):
    class Meta:
        model = TeacherSalary
        fields = ["teacher_profile", "is_active"]


class TeacherAvailabilityFilter(django_filters.FilterSet):
    class Meta:
        model = TeacherAvailability
        fields = ["teacher_profile", "day_of_week", "is_available"]


class TeacherSpecializationFilter(django_filters.FilterSet):
    class Meta:
        model = TeacherSpecialization
        fields = ["teacher_profile", "subject_name", "is_primary"]


class TeacherDocumentFilter(django_filters.FilterSet):
    class Meta:
        model = TeacherDocument
        fields = ["teacher_profile", "document_type", "is_verified"]
