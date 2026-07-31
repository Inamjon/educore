from django.db import models

from common.db import schema_table
from common.models import SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin


class Role(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin):
    """Named collection of permissions. `organization` is NULL for
    system-level roles (e.g. super_admin) — not org-scoped via the usual
    mixin since that mixin requires a non-null organization.
    """

    organization = models.ForeignKey(
        "foundation.Organization",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        db_column="organization_id",
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.CharField(max_length=255, blank=True, null=True)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = schema_table("foundation", "roles")
        constraints = [
            models.UniqueConstraint(fields=["organization", "slug"], name="uq_roles_org_slug"),
        ]
        indexes = [
            models.Index(
                fields=["organization"],
                name="idx_roles_org_id",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return self.name
