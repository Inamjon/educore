from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin


class Submission(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """A student's answer to one Assignment. Deliberately has no `status`
    field, unlike Assignment: a row existing at all already means
    "submitted"; `score`/`feedback` being set means "graded". The other two
    statuses the frontend mock used ("pending"/"late") aren't properties of
    a Submission at all — they describe a student who HASN'T submitted yet,
    which is the absence of a row here, computed client-side by comparing
    each enrolled GroupMember against which Submissions exist for the
    Assignment (see homework/views.py::AssignmentSerializer's stats fields
    for the aggregate counts; per-student roster status is a frontend join
    of `groups/members/?group=` + `homework/submissions/?assignment=`, no
    new endpoint needed).
    """

    assignment = models.ForeignKey(
        "homework.Assignment", on_delete=models.CASCADE, db_column="assignment_id", related_name="submissions"
    )
    student_profile = models.ForeignKey(
        "student.StudentProfile", on_delete=models.CASCADE, db_column="student_profile_id", related_name="homework_submissions"
    )
    content = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, null=True)
    graded_by = models.UUIDField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = schema_table("homework", "submissions")
        constraints = [
            models.UniqueConstraint(fields=["assignment", "student_profile"], name="uq_submissions_assignment_student"),
        ]
        indexes = [
            models.Index(fields=["assignment"], name="idx_submissions_assignment", condition=models.Q(deleted_at__isnull=True)),
            models.Index(fields=["student_profile"], name="idx_submissions_student", condition=models.Q(deleted_at__isnull=True)),
        ]

    def __str__(self) -> str:
        return f"{self.student_profile_id} -> {self.assignment_id}"
