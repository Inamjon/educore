from django.db import models

from common.db import schema_table
from common.models import CreatedAtMixin, UUIDPrimaryKeyMixin

AUDIT_ACTION_CHOICES = [
    ("create", "Create"),
    ("read", "Read"),
    ("update", "Update"),
    ("delete", "Delete"),
    ("login", "Login"),
    ("logout", "Logout"),
    ("export", "Export"),
    ("import", "Import"),
]


class AuditLog(UUIDPrimaryKeyMixin, CreatedAtMixin):
    """Immutable, append-only record of significant actions. Never updated
    or soft-deleted — see common/audit.py for how rows get written (auth,
    payment, role-change, and deletion events only, per CLAUDE.md).
    """

    organization = models.ForeignKey(
        "foundation.Organization", null=True, blank=True, on_delete=models.SET_NULL, db_column="organization_id"
    )
    user = models.ForeignKey(
        "foundation.User", null=True, blank=True, on_delete=models.SET_NULL, db_column="user_id"
    )
    action = models.CharField(max_length=20, choices=AUDIT_ACTION_CHOICES)
    entity_type = models.CharField(max_length=100)
    entity_id = models.UUIDField(null=True, blank=True)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = schema_table("foundation", "audit_logs")
        indexes = [
            models.Index(fields=["organization", "-created_at"], name="idx_audit_logs_org_id"),
            models.Index(fields=["user", "-created_at"], name="idx_audit_logs_user_id"),
            models.Index(fields=["entity_type", "entity_id"], name="idx_audit_logs_entity"),
            models.Index(fields=["action", "-created_at"], name="idx_audit_logs_action"),
        ]

    def __str__(self) -> str:
        return f"{self.action} {self.entity_type} @ {self.created_at}"
