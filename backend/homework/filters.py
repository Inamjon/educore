import django_filters

from homework.models import Assignment, Submission


class AssignmentFilter(django_filters.FilterSet):
    class Meta:
        model = Assignment
        fields = ["group", "status"]


class SubmissionFilter(django_filters.FilterSet):
    class Meta:
        model = Submission
        fields = ["assignment", "student_profile"]
