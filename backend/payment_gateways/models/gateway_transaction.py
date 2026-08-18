from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, TimestampedMixin, UUIDPrimaryKeyMixin
from payment_gateways.models.gateway_account import PROVIDER_CHOICES

TRANSACTION_STATUS_CHOICES = [
    ("initiated", "Initiated"),  # checkout link built, provider hasn't contacted us yet
    ("pending", "Pending"),  # provider created/prepared the transaction on their side
    ("success", "Success"),
    ("failed", "Failed"),
    ("cancelled", "Cancelled"),
]


class GatewayTransaction(UUIDPrimaryKeyMixin, TimestampedMixin, OrganizationScopedMixin):
    """One row per checkout attempt against an Invoice. Deliberately NOT
    SoftDeleteMixin — like foundation.AuditLog, this is an append-and-
    transition ledger (status moves initiated -> pending -> success/failed/
    cancelled), never a manageable CRUD entity a user deletes; "cancelled"
    already IS this row's own undo state.

    `merchant_trans_id` is Mentorio's own opaque reference, minted when the
    checkout link is built (services/checkout.py) and handed to Payme/Click
    as the account/transaction_param — the anchor idempotency is built on
    before the provider has assigned anything of their own.
    `provider_transaction_id` is filled in once the provider's webhook first
    contacts us (Payme's CreateTransaction `id` / Click's `click_trans_id`)
    and is the second idempotency anchor, guarding against duplicate webhook
    delivery re-crediting the same invoice twice.
    """

    invoice = models.ForeignKey(
        "finance.Invoice", on_delete=models.RESTRICT, db_column="invoice_id", related_name="gateway_transactions"
    )
    student_profile = models.ForeignKey(
        "student.StudentProfile",
        on_delete=models.RESTRICT,
        db_column="student_profile_id",
        related_name="gateway_transactions",
    )
    payment = models.ForeignKey(
        "finance.Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="payment_id",
        related_name="gateway_transactions",
    )
    provider = models.CharField(max_length=10, choices=PROVIDER_CHOICES)
    merchant_trans_id = models.CharField(max_length=64)
    provider_transaction_id = models.CharField(max_length=64, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="UZS")
    status = models.CharField(max_length=10, choices=TRANSACTION_STATUS_CHOICES, default="initiated")
    provider_state = models.SmallIntegerField(blank=True, null=True)
    error_code = models.CharField(max_length=20, blank=True, null=True)
    error_note = models.TextField(blank=True, null=True)
    raw_payload = models.JSONField(default=dict, blank=True)
    performed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    created_by = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = schema_table("payment_gateways", "gateway_transactions")
        constraints = [
            models.CheckConstraint(condition=models.Q(amount__gt=0), name="chk_gateway_transactions_amount"),
            models.UniqueConstraint(
                fields=["organization", "merchant_trans_id"], name="uq_gateway_transactions_merchant_trans_id"
            ),
            models.UniqueConstraint(
                fields=["provider", "provider_transaction_id"],
                name="uq_gateway_transactions_provider_txn_id",
                condition=models.Q(provider_transaction_id__isnull=False),
            ),
        ]
        indexes = [
            models.Index(fields=["organization"], name="idx_gateway_txns_org"),
            models.Index(fields=["invoice"], name="idx_gateway_txns_invoice"),
            models.Index(fields=["provider", "provider_transaction_id"], name="idx_gateway_txns_provider_txn"),
        ]

    def __str__(self) -> str:
        return f"{self.provider}:{self.merchant_trans_id} ({self.status})"
