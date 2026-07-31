from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

SALARY_TYPE_CHOICES = [
    ("fixed", "Fixed"),
    ("hourly", "Hourly"),
    ("per_lesson", "Per Lesson"),
    ("per_student", "Per Student"),
    ("percentage", "Percentage"),
]


class TeacherSalary(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """Salary configuration/history. Only one row should be `is_active` per
    teacher at a time — a business rule, not DB-enforced (the source DDL
    doesn't add a partial unique index for it either), so the API layer is
    responsible for deactivating the previous row when activating a new one.
    """

    teacher_profile = models.ForeignKey(
        "teacher.TeacherProfile", on_delete=models.CASCADE, db_column="teacher_profile_id", related_name="salaries"
    )
    salary_type = models.CharField(max_length=20, choices=SALARY_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="UZS")
    percentage_value = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = schema_table("teacher", "teacher_salaries")
        constraints = [
            models.CheckConstraint(condition=models.Q(amount__gte=0), name="chk_salary_amount"),
            models.CheckConstraint(
                condition=models.Q(percentage_value__isnull=True)
                | (models.Q(percentage_value__gte=0) & models.Q(percentage_value__lte=100)),
                name="chk_salary_percentage",
            ),
            models.CheckConstraint(
                condition=models.Q(effective_to__isnull=True) | models.Q(effective_to__gte=models.F("effective_from")),
                name="chk_salary_dates",
            ),
        ]
        indexes = [
            models.Index(fields=["teacher_profile"], name="idx_teacher_salaries_teacher", condition=models.Q(deleted_at__isnull=True)),
            models.Index(
                fields=["teacher_profile", "is_active"],
                name="idx_teacher_salaries_active",
                condition=models.Q(is_active=True, deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.teacher_profile_id}: {self.salary_type} {self.amount} {self.currency}"
