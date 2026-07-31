from django.db import models

from common.db import schema_table
from common.models import TimestampedMixin, UUIDPrimaryKeyMixin

TOKEN_STATUS_CHOICES = [
    ("active", "Active"),
    ("revoked", "Revoked"),
    ("expired", "Expired"),
]


class RefreshToken(UUIDPrimaryKeyMixin, TimestampedMixin):
    """Persisted refresh tokens for JWT rotation — see
    auth_custom/services/token_service.py for issue/rotate/revoke and the
    "max 5 active per user" rule (a DDL comment, enforced there, not by a
    DB constraint).
    """

    user = models.ForeignKey("foundation.User", on_delete=models.CASCADE, related_name="refresh_tokens")
    organization = models.ForeignKey("foundation.Organization", on_delete=models.CASCADE, db_column="organization_id")
    token_hash = models.CharField(max_length=255, unique=True)
    device_info = models.CharField(max_length=500, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=TOKEN_STATUS_CHOICES, default="active")
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_reason = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = schema_table("auth", "refresh_tokens")
        constraints = [
            models.CheckConstraint(condition=models.Q(expires_at__gt=models.F("created_at")), name="chk_refresh_tokens_expiry"),
        ]
        indexes = [
            models.Index(fields=["user", "status"], name="idx_refresh_tokens_user"),
            models.Index(
                fields=["token_hash"], name="idx_refresh_tokens_hash", condition=models.Q(status="active")
            ),
            models.Index(
                fields=["expires_at"], name="idx_refresh_tokens_expires", condition=models.Q(status="active")
            ),
        ]
