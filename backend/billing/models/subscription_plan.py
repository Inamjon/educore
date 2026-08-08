from django.core.validators import MinValueValidator
from django.db import models

from common.db import schema_table
from common.models import SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

BILLING_CYCLE_CHOICES = [
    ("monthly", "Monthly"),
    ("annual", "Annual"),
]


class SubscriptionPlan(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin):
    """Platform-wide catalog of subscription tiers EduCore sells to
    organizations (centers) — NOT an organization's own students paying that
    organization (see `finance.Invoice`/`finance.Payment`) and NOT a student
    paying online via a center's own Payme/Click account (see
    `payment_gateways`). This is the third, distinct "billing" concept in
    this codebase: platform <-> organization.

    No `organization` FK and deliberately no RLS — like `foundation.Permission`,
    this is global reference data every organization can see (to know what
    they're on / what they could upgrade to), not tenant data. Only
    super_admin (a system-level role) can create/update/delete one; see
    `billing/views.py`.

    `max_branches`/`max_students`/`max_teachers` here are informational/
    billing metadata — what a plan is *sold* as including — not a second
    source of truth for enforcement. `foundation.Organization` keeps its own
    independently-editable `max_students`/`max_teachers`/`max_branches`
    (e.g. for a negotiated "custom" deal above what a plan nominally offers);
    nothing that currently enforces those limits reads this table.
    """

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    # MinValueValidator is a serializer/form-level check (DRF's ModelSerializer
    # picks up model-field validators automatically); the CheckConstraint
    # below is the DB-level backstop, same "belt and suspenders" pattern as
    # finance.Payment's positive-amount constraint.
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES, default="monthly")
    max_branches = models.PositiveIntegerField(default=1)
    max_students = models.PositiveIntegerField(default=50)
    max_teachers = models.PositiveIntegerField(default=10)
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = schema_table("billing", "subscription_plans")
        ordering = ["display_order", "price"]
        constraints = [
            models.CheckConstraint(condition=models.Q(price__gte=0), name="chk_subscription_plans_price_non_negative"),
        ]
        indexes = [
            models.Index(fields=["is_active"], name="idx_subscription_plans_active"),
        ]

    def __str__(self) -> str:
        return self.name
