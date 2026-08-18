import django_filters

from exams.models import Exam, ExamResult


class ExamFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Exam
        # "organization" was missing here — harmless for an org-scoped
        # caller (RLS already narrows those rows regardless of what's
        # passed), but meant a platform-wide caller (super_admin, RLS
        # bypassed) had no way to filter down to one center — needed for
        # the Super-Admin Exams oversight page. Same shape as teacher.
        # filters.py::TeacherProfileFilter's "organization" field.
        fields = ["organization", "group", "status", "date"]


class ExamResultFilter(django_filters.FilterSet):
    class Meta:
        model = ExamResult
        fields = ["exam", "student_profile"]
