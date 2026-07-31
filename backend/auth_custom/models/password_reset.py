from django.db import models

from common.db import schema_table
from common.models import CreatedAtMixin, UUIDPrimaryKeyMixin


class PasswordReset(UUIDPrimaryKeyMixin, CreatedAtMixin):
    """Token valid for 1 hour; only the latest token is valid per user
    (enforced in auth_custom/services, not by a DB constraint)."""

    user = models.ForeignKey("foundation.User", on_delete=models.CASCADE, related_name="password_resets")
    organization = models.ForeignKey("foundation.Organization", on_delete=models.CASCADE, db_column="organization_id")
    token_hash = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = schema_table("auth", "password_resets")
        constraints = [
            models.CheckConstraint(
                condition=models.Q(expires_at__gt=models.F("created_at")), name="chk_password_resets_expiry"
            ),
        ]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="idx_password_resets_user"),
            models.Index(
                fields=["token_hash"], name="idx_password_resets_token", condition=models.Q(used_at__isnull=True)
            ),
        ]
