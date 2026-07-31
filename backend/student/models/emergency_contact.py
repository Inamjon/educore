from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin


class EmergencyContact(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """Emergency contact for a student — distinct from student_parents
    (safety/medical-emergency use, not general communication)."""

    student_profile = models.ForeignKey(
        "student.StudentProfile",
        on_delete=models.CASCADE,
        db_column="student_profile_id",
        related_name="emergency_contacts",
    )
    full_name = models.CharField(max_length=200)
    relationship = models.CharField(max_length=50)
    phone_primary = models.CharField(max_length=20)
    phone_secondary = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    priority = models.SmallIntegerField(default=1)

    class Meta:
        db_table = schema_table("student", "emergency_contacts")
        constraints = [
            models.CheckConstraint(
                condition=models.Q(priority__gte=1) & models.Q(priority__lte=5), name="chk_emergency_priority"
            ),
        ]
        indexes = [
            models.Index(
                fields=["student_profile"],
                name="idx_emergency_contacts_student",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.relationship})"
