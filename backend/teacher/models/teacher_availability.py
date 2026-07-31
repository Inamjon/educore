from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

DAY_OF_WEEK_CHOICES = [
    ("monday", "Monday"),
    ("tuesday", "Tuesday"),
    ("wednesday", "Wednesday"),
    ("thursday", "Thursday"),
    ("friday", "Friday"),
    ("saturday", "Saturday"),
    ("sunday", "Sunday"),
]


class TeacherAvailability(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """Weekly availability windows, used by the future schedule module to
    avoid double-booking a teacher. Overlap prevention is left to the
    scheduling service (Stage 4), not a DB constraint here.
    """

    teacher_profile = models.ForeignKey(
        "teacher.TeacherProfile", on_delete=models.CASCADE, db_column="teacher_profile_id", related_name="availability"
    )
    day_of_week = models.CharField(max_length=10, choices=DAY_OF_WEEK_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    effective_from = models.DateField(null=True, blank=True)
    effective_to = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = schema_table("teacher", "teacher_availability")
        constraints = [
            models.CheckConstraint(condition=models.Q(end_time__gt=models.F("start_time")), name="chk_availability_times"),
            models.CheckConstraint(
                condition=models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=models.F("effective_from")),
                name="chk_availability_dates",
            ),
        ]
        indexes = [
            models.Index(
                fields=["teacher_profile", "day_of_week"],
                name="idx_teacher_avail_teacher",
                condition=models.Q(deleted_at__isnull=True),
            ),
            models.Index(fields=["organization"], name="idx_teacher_availability_org", condition=models.Q(deleted_at__isnull=True)),
        ]

    def __str__(self) -> str:
        return f"{self.teacher_profile_id}: {self.day_of_week} {self.start_time}-{self.end_time}"
