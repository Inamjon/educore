from django.db import models

from common.db import schema_table
from common.models import TimestampedMixin, UUIDPrimaryKeyMixin


class Permission(UUIDPrimaryKeyMixin, TimestampedMixin):
    """Platform-level, not per-organization — granular actions that can be
    performed, e.g. module='students', action='create'.
    """

    module = models.CharField(max_length=50)
    action = models.CharField(max_length=50)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = schema_table("foundation", "permissions")
        constraints = [
            models.UniqueConstraint(fields=["module", "action"], name="uq_permissions_module_action"),
        ]
        indexes = [
            models.Index(fields=["module"], name="idx_permissions_module"),
        ]

    def __str__(self) -> str:
        return f"{self.module}.{self.action}"
