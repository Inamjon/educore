import django_filters

from attendance.models import Attendance


class AttendanceFilter(django_filters.FilterSet):
    class Meta:
        model = Attendance
        fields = ["organization", "group", "student_profile", "date", "status"]
