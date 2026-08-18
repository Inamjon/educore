import django_filters

from attendance.models import Attendance


class AttendanceFilter(django_filters.FilterSet):
    # Same shape as exams.filters.ExamFilter's date_from/date_to — needed so
    # the Admin oversight page (frontend/app/(admin)/attendance/page.tsx) can
    # bound its default query to a recent window instead of paging through
    # an org's entire attendance history, which grows without limit.
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Attendance
        fields = ["organization", "group", "student_profile", "date", "status"]
