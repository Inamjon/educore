from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin


class TeacherSpecialization(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    teacher_profile = models.ForeignKey(
        "teacher.TeacherProfile",
        on_delete=models.CASCADE,
        db_column="teacher_profile_id",
        related_name="specializations",
    )
    subject_name = models.CharField(max_length=100)
    proficiency_level = models.CharField(max_length=50, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    certificate_url = models.TextField(blank=True, null=True)
    years_experience = models.SmallIntegerField(default=0)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = schema_table("teacher", "teacher_specializations")
        constraints = [
            models.UniqueConstraint(fields=["teacher_profile", "subject_name"], name="uq_teacher_spec_subject"),
            models.CheckConstraint(condition=models.Q(years_experience__gte=0), name="chk_spec_experience"),
        ]
        indexes = [
            models.Index(
                fields=["teacher_profile"],
                name="idx_teacher_spec_teacher",
                condition=models.Q(deleted_at__isnull=True),
            ),
            models.Index(
                fields=["organization", "subject_name"],
                name="idx_teacher_spec_subject",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.teacher_profile_id}: {self.subject_name}"
