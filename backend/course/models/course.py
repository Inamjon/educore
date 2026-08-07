from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

COURSE_STATUS_CHOICES = [
    ("draft", "Draft"),
    ("active", "Active"),
    ("archived", "Archived"),
    ("discontinued", "Discontinued"),
]

COURSE_LEVEL_CHOICES = [
    ("beginner", "Beginner"),
    ("intermediate", "Intermediate"),
    ("advanced", "Advanced"),
]


class Course(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """The course catalog — org-scoped subject offerings that Groups run
    against. Trimmed from database/06-course-management.sql's full design:
    `category`/`level` are plain fields here rather than separate
    course_categories/course_levels tables (nothing consumes a managed
    category/level list yet), and course_materials isn't modeled at all
    (no file-upload flow exists yet either) — both addable later without
    breaking this shape.
    """

    branch = models.ForeignKey(
        "foundation.Branch", null=True, blank=True, on_delete=models.SET_NULL, db_column="branch_id"
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    category = models.CharField(max_length=100)
    level = models.CharField(max_length=20, choices=COURSE_LEVEL_CHOICES, default="beginner")
    description = models.TextField(blank=True, null=True)
    duration_weeks = models.SmallIntegerField(null=True, blank=True)
    total_lessons = models.SmallIntegerField(null=True, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="UZS")
    status = models.CharField(max_length=20, choices=COURSE_STATUS_CHOICES, default="draft")
    color = models.CharField(max_length=7, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = schema_table("course", "courses")
        constraints = [
            models.UniqueConstraint(fields=["organization", "code"], name="uq_courses_org_code"),
            models.CheckConstraint(
                condition=models.Q(duration_weeks__isnull=True) | models.Q(duration_weeks__gt=0),
                name="chk_courses_duration_weeks",
            ),
            models.CheckConstraint(
                condition=models.Q(price__isnull=True) | models.Q(price__gte=0), name="chk_courses_price"
            ),
        ]
        indexes = [
            models.Index(fields=["organization"], name="idx_courses_org", condition=models.Q(deleted_at__isnull=True)),
            models.Index(
                fields=["organization", "status"], name="idx_courses_status", condition=models.Q(deleted_at__isnull=True)
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"
