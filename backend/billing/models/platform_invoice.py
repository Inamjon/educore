from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

PLATFORM_INVOICE_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("partially_paid", "Partially Paid"),
    ("paid", "Paid"),
    ("overdue", "Overdue"),
    ("cancelled", "Cancelled"),
]


class PlatformInvoice(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """EduCore's own bill to an organization for one subscription billing
    period — the platform <-> organization counterpart of `finance.Invoice`
    (an organization's bill to its own student). Manually created by
    super_admin, not auto-generated on a schedule (see plan doc — automated
    recurring billing is out of scope for this manual-tracking phase).

    `subscription_plan` is a snapshot FK (RESTRICT — never silently
    orphaned), not a live read of the organization's *current* plan
    assignment: a plan's price can change, or the org can switch plans,
    after this invoice was issued, but the invoice must keep showing what
    was actually charged at the time.
    """

    subscription_plan = models.ForeignKey(
        "billing.SubscriptionPlan", on_delete=models.RESTRICT,
        db_column="subscription_plan_id", related_name="platform_invoices",
    )
    invoice_number = models.CharField(max_length=50, unique=True)  # platform-wide numbering, not per-org
    status = models.CharField(max_length=20, choices=PLATFORM_INVOICE_STATUS_CHOICES, default="pending")
    period_start = models.DateField()
    period_end = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    due_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = schema_table("billing", "platform_invoices")
        constraints = [
            models.CheckConstraint(condition=models.Q(amount__gte=0), name="chk_platform_invoices_amount"),
            models.CheckConstraint(
                condition=models.Q(period_end__gt=models.F("period_start")), name="chk_platform_invoices_period"
            ),
        ]
        indexes = [
            models.Index(
                fields=["organization"], name="idx_platform_invoices_org", condition=models.Q(deleted_at__isnull=True)
            ),
            models.Index(
                fields=["organization", "status"], name="idx_platform_invoices_status",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.invoice_number} ({self.status})"
