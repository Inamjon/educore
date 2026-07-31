from django.core.validators import RegexValidator
from django.db import models

from common.db import schema_table
from common.models import SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

ORGANIZATION_STATUS_CHOICES = [
    ("active", "Active"),
    ("suspended", "Suspended"),
    ("trial", "Trial"),
    ("cancelled", "Cancelled"),
]

SUBSCRIPTION_PLAN_CHOICES = [
    ("free", "Free"),
    ("starter", "Starter"),
    ("basic", "Basic"),
    ("pro", "Pro"),
    ("enterprise", "Enterprise"),
    ("custom", "Custom"),
]

email_validator = RegexValidator(
    regex=r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$",
    message="Enter a valid email address.",
)


class Organization(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin):
    """Root tenant entity — every education center is an organization.
    Multi-tenant isolation anchor; all tenant-scoped tables reference this.
    """

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    legal_name = models.CharField(max_length=255, blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    logo_url = models.TextField(blank=True, null=True)
    website = models.CharField(max_length=255, blank=True, null=True)
    email = models.CharField(max_length=255, validators=[email_validator])
    phone = models.CharField(max_length=20, blank=True, null=True)
    address_line1 = models.CharField(max_length=255, blank=True, null=True)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=3, default="UZB")
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    timezone = models.CharField(max_length=50, default="Asia/Tashkent")
    locale = models.CharField(max_length=10, default="uz")
    currency = models.CharField(max_length=3, default="UZS")
    status = models.CharField(max_length=20, choices=ORGANIZATION_STATUS_CHOICES, default="trial")
    subscription_plan = models.CharField(max_length=50, choices=SUBSCRIPTION_PLAN_CHOICES, default="free")
    max_students = models.PositiveIntegerField(default=50)
    max_teachers = models.PositiveIntegerField(default=10)
    max_branches = models.PositiveIntegerField(default=1)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    subscription_ends_at = models.DateTimeField(null=True, blank=True)
    settings = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = schema_table("foundation", "organizations")
        constraints = [
            models.CheckConstraint(condition=models.Q(max_students__gt=0), name="chk_organizations_max_students"),
            models.CheckConstraint(condition=models.Q(max_teachers__gt=0), name="chk_organizations_max_teachers"),
        ]
        indexes = [
            models.Index(
                fields=["status"],
                name="idx_organizations_status",
                condition=models.Q(deleted_at__isnull=True),
            ),
            models.Index(
                fields=["country"],
                name="idx_organizations_country",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return self.name
