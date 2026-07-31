from django.db import models

from common.db import schema_table
from common.models import OrganizationScopedMixin, SoftDeleteMixin, TimestampedMixin, UUIDPrimaryKeyMixin

FILE_CATEGORY_CHOICES = [
    ("avatar", "Avatar"),
    ("document", "Document"),
    ("material", "Material"),
    ("homework", "Homework"),
    ("certificate", "Certificate"),
    ("other", "Other"),
]


class File(UUIDPrimaryKeyMixin, TimestampedMixin, SoftDeleteMixin, OrganizationScopedMixin):
    """Centralized file/attachment registry — polymorphic via entity_type/id,
    used by every other module rather than each having its own uploads table.
    """

    uploaded_by = models.ForeignKey(
        "foundation.User", on_delete=models.SET_NULL, null=True, related_name="uploaded_files"
    )
    category = models.CharField(max_length=20, choices=FILE_CATEGORY_CHOICES, default="other")
    original_name = models.CharField(max_length=500)
    stored_name = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.BigIntegerField()
    storage_path = models.TextField()
    storage_provider = models.CharField(max_length=50, default="s3")
    entity_type = models.CharField(max_length=100, blank=True, null=True)
    entity_id = models.UUIDField(null=True, blank=True)
    is_public = models.BooleanField(default=False)
    checksum = models.CharField(max_length=64, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = schema_table("foundation", "files")
        constraints = [
            models.CheckConstraint(condition=models.Q(size_bytes__gt=0), name="chk_files_size"),
        ]
        indexes = [
            models.Index(
                fields=["organization"], name="idx_files_org_id", condition=models.Q(deleted_at__isnull=True)
            ),
            models.Index(
                fields=["entity_type", "entity_id"],
                name="idx_files_entity",
                condition=models.Q(deleted_at__isnull=True),
            ),
            models.Index(
                fields=["uploaded_by"], name="idx_files_uploaded_by", condition=models.Q(deleted_at__isnull=True)
            ),
            models.Index(
                fields=["organization", "category"],
                name="idx_files_category",
                condition=models.Q(deleted_at__isnull=True),
            ),
        ]

    def __str__(self) -> str:
        return self.original_name
