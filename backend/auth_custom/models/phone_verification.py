from django.db import models

from common.db import schema_table
from common.models import CreatedAtMixin, UUIDPrimaryKeyMixin
from auth_custom.models.email_verification import VERIFICATION_STATUS_CHOICES


class PhoneVerification(UUIDPrimaryKeyMixin, CreatedAtMixin):
    """OTP valid 5 min, max 3 attempts, cooldown between sends (enforced in
    auth_custom/services, not by a DB constraint)."""

    user = models.ForeignKey("foundation.User", on_delete=models.CASCADE, related_name="phone_verifications")
    organization = models.ForeignKey("foundation.Organization", on_delete=models.CASCADE, db_column="organization_id")
    phone = models.CharField(max_length=20)
    code = models.CharField(max_length=10)
    attempts = models.SmallIntegerField(default=0)
    max_attempts = models.SmallIntegerField(default=3)
    status = models.CharField(max_length=10, choices=VERIFICATION_STATUS_CHOICES, default="pending")
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    sent_via = models.CharField(max_length=20, default="sms")

    class Meta:
        db_table = schema_table("auth", "phone_verifications")
        constraints = [
            models.CheckConstraint(condition=models.Q(attempts__lte=models.F("max_attempts")), name="chk_phone_verif_attempts"),
            models.CheckConstraint(
                condition=models.Q(expires_at__gt=models.F("created_at")), name="chk_phone_verif_expiry"
            ),
        ]
        indexes = [
            models.Index(fields=["user", "status"], name="idx_phone_verifications_user"),
            models.Index(
                fields=["phone", "code"], name="idx_phone_verifications_code", condition=models.Q(status="pending")
            ),
        ]
