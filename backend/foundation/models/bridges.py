from django.db import models

from common.db import schema_table
from common.models import CreatedAtMixin, TimestampedMixin, UUIDPrimaryKeyMixin


class UserRole(UUIDPrimaryKeyMixin, TimestampedMixin):
    """M:N bridge: a user can have multiple roles; a role can be assigned to
    many users. `organization` is kept explicit (not derived from user/role)
    to match the DDL and so RLS policies on this table alone are sufficient.
    """

    user = models.ForeignKey("foundation.User", on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey("foundation.Role", on_delete=models.CASCADE, related_name="user_roles")
    organization = models.ForeignKey("foundation.Organization", on_delete=models.CASCADE, db_column="organization_id")
    assigned_by = models.ForeignKey(
        "foundation.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = schema_table("foundation", "user_roles")
        constraints = [
            models.UniqueConstraint(fields=["user", "role", "organization"], name="uq_user_roles_user_role"),
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_user_roles_user_id"),
            models.Index(fields=["role"], name="idx_user_roles_role_id"),
            models.Index(fields=["organization"], name="idx_user_roles_org_id"),
        ]


class RolePermission(UUIDPrimaryKeyMixin, CreatedAtMixin):
    """M:N bridge: what each role is allowed to do. Immutable-ish — no
    updated_at/deleted_at in the DDL, rows are added/removed, not edited.
    """

    role = models.ForeignKey(
        "foundation.Role", on_delete=models.CASCADE, related_name="role_permissions"
    )
    permission = models.ForeignKey(
        "foundation.Permission", on_delete=models.CASCADE, related_name="role_permissions"
    )

    class Meta:
        db_table = schema_table("foundation", "role_permissions")
        constraints = [
            models.UniqueConstraint(fields=["role", "permission"], name="uq_role_permissions_role_perm"),
        ]
        indexes = [
            models.Index(fields=["role"], name="idx_role_permissions_role_id"),
            models.Index(fields=["permission"], name="idx_role_permissions_perm_id"),
        ]
