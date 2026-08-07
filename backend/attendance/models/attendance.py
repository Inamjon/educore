from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

ATTENDANCE_STATUS_CHOICES = [
    ("present", "Present"),
    ("absent", "Absent"),
    ("late", "Late"),
    ("excused", "Excused"),
    ("early_leave", "Early Leave"),
    ("sick", "Sick"),
]


class Attendance(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """One student's attendance record for one group session. Trimmed from
    database/09-attendance.sql: keyed on (group, date) instead of a
    schedule.lessons FK — no Schedule/Lesson module exists yet, and nothing
    needs one to record "who showed up on this date" today. Also drops
    late_reasons, attendance_history, and check-in/out timing — none have a
    frontend consumer; addable later without breaking this shape.
    """

    group = models.ForeignKey(
        "groups.Group", on_delete=models.CASCADE, db_column="group_id", related_name="attendance_records"
    )
    student_profile = models.ForeignKey(
        "student.StudentProfile", on_delete=models.CASCADE, db_column="student_profile_id", related_name="attendance_records"
    )
    date = models.DateField()
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS_CHOICES, default="present")
    notes = models.TextField(blank=True, null=True)
    marked_by = models.UUIDField(null=True, blank=True)
    marked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = schema_table("attendance", "attendances")
        constraints = [
            models.UniqueConstraint(fields=["group", "student_profile", "date"], name="uq_attendance_group_student_date"),
        ]
        indexes = [
            models.Index(
                fields=["group", "date"], name="idx_attendance_group_date", condition=models.Q(deleted_at__isnull=True)
            ),
            models.Index(
                fields=["student_profile"], name="idx_attendance_student", condition=models.Q(deleted_at__isnull=True)
            ),
            models.Index(
                fields=["organization", "status"], name="idx_attendance_org_status", condition=models.Q(deleted_at__isnull=True)
            ),
        ]

    def __str__(self) -> str:
        return f"{self.student_profile_id} @ {self.group_id} on {self.date}: {self.status}"
