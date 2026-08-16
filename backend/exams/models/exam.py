from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

EXAM_STATUS_CHOICES = [
    ("scheduled", "Scheduled"),
    ("completed", "Completed"),
    ("cancelled", "Cancelled"),
]


class Exam(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """A scheduled exam session for a Group — schedule-like metadata, same
    treatment as `schedule.Lesson`/`homework.Assignment`: not personal data,
    so reads are unrestricted within the org (see `ExamViewSet`, no
    `get_queryset` override). Per-student scores live on the separate
    `ExamResult` model, which IS row-scoped, same split as
    Assignment/Submission. `status` is teacher-controlled (mirrors `Lesson`)
    rather than derived from `date` — a teacher explicitly marks an exam
    completed/cancelled, no automatic date-based transition. `question_count`
    is a plain informational integer, not a real question bank — no online
    exam-taking exists or is planned here.
    """

    group = models.ForeignKey("groups.Group", on_delete=models.CASCADE, db_column="group_id", related_name="exams")
    title = models.CharField(max_length=255)
    date = models.DateField()
    start_time = models.TimeField()
    duration_minutes = models.PositiveSmallIntegerField(default=90)
    room = models.CharField(max_length=100, blank=True, null=True)
    max_score = models.PositiveSmallIntegerField(default=100)
    question_count = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=20, choices=EXAM_STATUS_CHOICES, default="scheduled")
    created_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = schema_table("exams", "exams")
        constraints = [
            # Scoped to live rows only (see ExamResult's sibling constraint
            # for the soft-delete gotcha this avoids) — otherwise cancelling
            # then re-scheduling an exam at the exact same group/date/time
            # after a soft-delete would hit a stale constraint from a row
            # nothing can see anymore.
            models.UniqueConstraint(
                fields=["group", "date", "start_time"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_exams_group_date_start",
            ),
            models.CheckConstraint(condition=models.Q(max_score__gt=0), name="chk_exams_max_score"),
            models.CheckConstraint(condition=models.Q(duration_minutes__gt=0), name="chk_exams_duration"),
        ]
        indexes = [
            models.Index(fields=["group", "date"], name="idx_exams_group_date", condition=models.Q(deleted_at__isnull=True)),
            models.Index(
                fields=["organization", "status"], name="idx_exams_org_status", condition=models.Q(deleted_at__isnull=True)
            ),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.group_id})"
