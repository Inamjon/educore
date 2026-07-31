from django.db import models

from common.db import schema_table
from common.models import TimestampedMixin, UUIDPrimaryKeyMixin


class Session(UUIDPrimaryKeyMixin, TimestampedMixin):
    """Active session tracking — this is what powers the real "Active
    Sessions" list + "Revoke" button already built (mocked) on the Teacher
    and Super-Admin Profile pages. SessionValidatingJWTAuthentication checks
    `is_active`/`expires_at` on every authenticated request, so revoking
    here takes effect immediately rather than only at token expiry.
    """

    user = models.ForeignKey("foundation.User", on_delete=models.CASCADE, related_name="sessions")
    organization = models.ForeignKey("foundation.Organization", on_delete=models.CASCADE, db_column="organization_id")
    token_hash = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    device_type = models.CharField(max_length=50, blank=True, null=True)
    device_name = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    # Not auto_now[_add]: set explicitly at creation and bumped via a plain
    # .update() on every authenticated request (see
    # common/authentication.py) — auto_now_add would be misleading metadata
    # here since the whole point is that this value keeps changing.
    last_activity_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    end_reason = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = schema_table("auth", "sessions")
        constraints = [
            models.CheckConstraint(condition=models.Q(expires_at__gt=models.F("created_at")), name="chk_sessions_expiry"),
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_sessions_user_active", condition=models.Q(is_active=True)),
            models.Index(fields=["organization"], name="idx_sessions_org", condition=models.Q(is_active=True)),
            models.Index(fields=["expires_at"], name="idx_sessions_expires", condition=models.Q(is_active=True)),
            models.Index(
                fields=["last_activity_at"], name="idx_sessions_last_activity", condition=models.Q(is_active=True)
            ),
        ]
