from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

MEMBER_STATUS_CHOICES = [
    ("active", "Active"),
    ("completed", "Completed"),
    ("dropped", "Dropped"),
    ("transferred", "Transferred"),
    ("suspended", "Suspended"),
]


class GroupMember(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """Student enrollment in a Group (M:N bridge). Trimmed from
    database/07-group-management.sql: no `final_grade`/`attendance_rate` —
    same reasoning as dropping Student's mock attendanceRate/balance fields,
    no Grades or Attendance backend exists yet to make those real.
    """

    group = models.ForeignKey(
        "groups.Group", on_delete=models.CASCADE, db_column="group_id", related_name="members"
    )
    student_profile = models.ForeignKey(
        "student.StudentProfile", on_delete=models.CASCADE, db_column="student_profile_id", related_name="group_memberships"
    )
    status = models.CharField(max_length=20, choices=MEMBER_STATUS_CHOICES, default="active")
    completed_at = models.DateTimeField(null=True, blank=True)
    dropped_at = models.DateTimeField(null=True, blank=True)
    drop_reason = models.TextField(blank=True, null=True)
    created_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = schema_table("group", "group_members")
        constraints = [
            models.UniqueConstraint(fields=["group", "student_profile"], name="uq_group_members_student"),
        ]
        indexes = [
            models.Index(fields=["group"], name="idx_group_members_group", condition=models.Q(deleted_at__isnull=True)),
            models.Index(
                fields=["student_profile"], name="idx_group_members_student", condition=models.Q(deleted_at__isnull=True)
            ),
            models.Index(
                fields=["organization", "status"],
                name="idx_group_members_org_status",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.student_profile_id} in {self.group_id}"
