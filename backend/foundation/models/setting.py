from django.db import models

from common.db import schema_table
from common.models import TimestampedMixin, UUIDPrimaryKeyMixin

SETTING_SCOPE_CHOICES = [
    ("platform", "Platform"),
    ("organization", "Organization"),
    ("branch", "Branch"),
    ("user", "User"),
]


class Setting(UUIDPrimaryKeyMixin, TimestampedMixin):
    """Key-value configuration at platform/org/branch/user level —
    hierarchical override, no schema changes needed to add new settings.
    """

    organization = models.ForeignKey(
        "foundation.Organization", null=True, blank=True, on_delete=models.CASCADE, db_column="organization_id"
    )
    branch = models.ForeignKey(
        "foundation.Branch", null=True, blank=True, on_delete=models.CASCADE, db_column="branch_id"
    )
    user = models.ForeignKey(
        "foundation.User", null=True, blank=True, on_delete=models.CASCADE, db_column="user_id"
    )
    scope = models.CharField(max_length=20, choices=SETTING_SCOPE_CHOICES, default="organization")
    key = models.CharField(max_length=255)
    value = models.JSONField()
    description = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        db_table = schema_table("foundation", "settings")
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "branch", "user", "key"], name="uq_settings_scope_key"
            ),
        ]
        indexes = [
            models.Index(fields=["organization", "key"], name="idx_settings_org_key"),
            models.Index(fields=["scope"], name="idx_settings_scope"),
        ]

    def __str__(self) -> str:
        return self.key
