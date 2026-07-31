from django.db import models

from common.db import schema_table
from common.models import CreatedAtMixin, UUIDPrimaryKeyMixin

VERIFICATION_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("verified", "Verified"),
    ("expired", "Expired"),
    ("failed", "Failed"),
]


class EmailVerification(UUIDPrimaryKeyMixin, CreatedAtMixin):
    """Code valid 15 min, max 3 attempts. Email here is optional contact
    info (not a login credential — see foundation.User.login_id) but can
    still be verified for account-recovery purposes."""

    user = models.ForeignKey("foundation.User", on_delete=models.CASCADE, related_name="email_verifications")
    organization = models.ForeignKey("foundation.Organization", on_delete=models.CASCADE, db_column="organization_id")
    email = models.EmailField()
    code = models.CharField(max_length=10)
    token_hash = models.CharField(max_length=255, blank=True, null=True)
    attempts = models.SmallIntegerField(default=0)
    max_attempts = models.SmallIntegerField(default=3)
    status = models.CharField(max_length=10, choices=VERIFICATION_STATUS_CHOICES, default="pending")
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = schema_table("auth", "email_verifications")
        constraints = [
            models.CheckConstraint(condition=models.Q(attempts__lte=models.F("max_attempts")), name="chk_email_verif_attempts"),
            models.CheckConstraint(
                condition=models.Q(expires_at__gt=models.F("created_at")), name="chk_email_verif_expiry"
            ),
        ]
        indexes = [
            models.Index(fields=["user", "status"], name="idx_email_verifications_user"),
            models.Index(
                fields=["email", "code"], name="idx_email_verifications_code", condition=models.Q(status="pending")
            ),
        ]
