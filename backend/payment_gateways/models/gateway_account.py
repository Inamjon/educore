from django.db import models

from common.db import schema_table
from common.fields import EncryptedTextField
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

PROVIDER_CHOICES = [
    ("payme", "Payme"),
    ("click", "Click"),
]


class PaymentGatewayAccount(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """A center's own Payme/Click merchant credentials — one row per
    (organization, provider). Money never passes through Mentorio: this row
    only holds what's needed to (a) build a checkout redirect link
    (merchant_id, service_id) and (b) verify that a webhook claiming to be
    Payme/Click really is (secret_key, encrypted at rest — see
    common/fields.py::EncryptedTextField). `service_id` is Click-only
    (Payme has no equivalent); left null for Payme rows.
    """

    provider = models.CharField(max_length=10, choices=PROVIDER_CHOICES)
    merchant_id = models.CharField(max_length=100)
    service_id = models.CharField(max_length=100, blank=True, null=True)
    secret_key = EncryptedTextField()
    is_active = models.BooleanField(default=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = schema_table("payment_gateways", "gateway_accounts")
        constraints = [
            models.UniqueConstraint(fields=["organization", "provider"], name="uq_gateway_accounts_org_provider"),
        ]
        indexes = [
            models.Index(
                fields=["organization"], name="idx_gateway_accounts_org", condition=models.Q(deleted_at__isnull=True)
            ),
        ]

    def __str__(self) -> str:
        return f"{self.get_provider_display()} — {self.organization_id}"
