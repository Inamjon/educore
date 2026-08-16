import django_filters

from exams.models import Exam, ExamResult


class ExamFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Exam
        fields = ["group", "status", "date"]


class ExamResultFilter(django_filters.FilterSet):
    class Meta:
        model = ExamResult
        fields = ["exam", "student_profile"]
