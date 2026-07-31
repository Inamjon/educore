import uuid

from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)

    def delete(self):
        """Bulk soft-delete — never issue a real DELETE from a queryset either."""
        return self.update(deleted_at=timezone.now())


class SoftDeleteManager(models.Manager):
    """Default manager: only rows that are not soft-deleted."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class UUIDPrimaryKeyMixin(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class CreatedAtMixin(models.Model):
    """For immutable, append-only tables (audit_logs, login_attempts, ...)."""

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class TimestampedMixin(CreatedAtMixin):
    """`updated_at` is intentionally NOT `auto_now`: the Postgres trigger
    (`foundation.update_updated_at()`, wired in migrations) owns this column
    so it stays correct even for rows touched outside Django. Setting both
    would just make two writers race over who's "correct" for no benefit.
    """

    updated_at = models.DateTimeField(editable=False)

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, default=None)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save(using=using, update_fields=["deleted_at"])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])


class OrganizationScopedMixin(models.Model):
    organization = models.ForeignKey(
        "foundation.Organization",
        on_delete=models.CASCADE,
        db_column="organization_id",
    )

    class Meta:
        abstract = True
