import django_filters

from student.models import EmergencyContact, StudentDocument, StudentParent, StudentProfile


class StudentProfileFilter(django_filters.FilterSet):
    class Meta:
        model = StudentProfile
        fields = ["organization", "branch", "status"]


class StudentParentFilter(django_filters.FilterSet):
    class Meta:
        model = StudentParent
        fields = ["student_profile", "relation", "is_primary_contact"]


class EmergencyContactFilter(django_filters.FilterSet):
    class Meta:
        model = EmergencyContact
        fields = ["student_profile"]


class StudentDocumentFilter(django_filters.FilterSet):
    class Meta:
        model = StudentDocument
        fields = ["student_profile", "document_type", "is_verified"]
