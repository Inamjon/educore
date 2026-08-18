import django_filters

from homework.models import Assignment, Submission


class AssignmentFilter(django_filters.FilterSet):
    class Meta:
        model = Assignment
        # "organization" was missing here — same gap as exams.filters.
        # ExamFilter, fixed the same way: needed for the Super-Admin
        # Homework oversight page to filter a platform-wide query down to
        # one center.
        fields = ["organization", "group", "status"]


class SubmissionFilter(django_filters.FilterSet):
    class Meta:
        model = Submission
        fields = ["organization", "assignment", "student_profile"]
