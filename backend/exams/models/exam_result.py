from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin


class ExamResult(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """One student's score for one Exam — sensitive per-student data, same
    treatment as `homework.Submission`/`attendance.Attendance`: reads are
    row-scoped by role (see `ExamResultViewSet.get_queryset`), never
    module-wide. `score` starts null (not yet entered) rather than the row
    not existing at all — unlike Submission (no row = "hasn't submitted"),
    here the teacher owns creating the roster-wide rows and fills scores in
    over time, so a null score is a real, distinct state worth keeping on
    its own row rather than inferring "ungraded" from absence.
    `graded_by`/`graded_at` are always server-stamped on write, never
    client-trusted — same rule as Submission.update().
    """

    exam = models.ForeignKey("exams.Exam", on_delete=models.CASCADE, db_column="exam_id", related_name="results")
    student_profile = models.ForeignKey(
        "student.StudentProfile", on_delete=models.CASCADE, db_column="student_profile_id", related_name="exam_results"
    )
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    graded_by = models.UUIDField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = schema_table("exams", "exam_results")
        constraints = [
            # Scoped to live rows only — SoftDeleteMixin.delete() just sets
            # deleted_at, the row stays physically present, so an
            # unconditioned constraint would block ever re-entering a result
            # for the same student/exam after a soft-deleted correction.
            models.UniqueConstraint(
                fields=["exam", "student_profile"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_exam_results_exam_student",
            ),
        ]
        indexes = [
            models.Index(fields=["exam"], name="idx_exam_results_exam", condition=models.Q(deleted_at__isnull=True)),
            models.Index(
                fields=["student_profile"], name="idx_exam_results_student", condition=models.Q(deleted_at__isnull=True)
            ),
        ]

    def __str__(self) -> str:
        return f"{self.student_profile_id} -> {self.exam_id}"
