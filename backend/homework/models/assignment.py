from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

ASSIGNMENT_STATUS_CHOICES = [
    ("active", "Active"),
    ("closed", "Closed"),
]


class Assignment(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """A homework assignment posted to a Group — the teacher-authored half
    of homework. `status` is a real, teacher-controlled field rather than
    derived from `due_date` (e.g. "still accepting late work" past the due
    date is a real state a teacher chooses, not something a date comparison
    alone can express) — see `Submission` for the per-student half, whose
    status IS fully computed, for the opposite reason: it has no owner-set
    state to preserve.
    """

    group = models.ForeignKey(
        "groups.Group", on_delete=models.CASCADE, db_column="group_id", related_name="assignments"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField()
    max_score = models.PositiveSmallIntegerField(default=100)
    status = models.CharField(max_length=20, choices=ASSIGNMENT_STATUS_CHOICES, default="active")
    created_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = schema_table("homework", "assignments")
        constraints = [
            models.CheckConstraint(condition=models.Q(max_score__gt=0), name="chk_assignments_max_score"),
        ]
        indexes = [
            models.Index(fields=["group"], name="idx_assignments_group", condition=models.Q(deleted_at__isnull=True)),
            models.Index(
                fields=["organization", "status"], name="idx_assignments_org_status", condition=models.Q(deleted_at__isnull=True)
            ),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.group_id})"
