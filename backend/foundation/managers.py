from django.contrib.auth.base_user import BaseUserManager
from django.db import connection

from common.models import SoftDeleteManager


def _next_code(prefix: str, sequence: str, width: int = 6) -> str:
    """Pull the next value from a Postgres sequence and format it as e.g.
    "EDU100001". Using nextval() directly (rather than a column DEFAULT
    expression) keeps generation explicit or unit-testable, and sidesteps
    Django's ORM always listing every non db_default field in its INSERT —
    the sequence itself is what guarantees atomicity/no collisions, not
    which layer calls nextval().
    """
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT nextval('foundation.{sequence}')")
        (value,) = cursor.fetchone()
    return f"{prefix}{str(value).zfill(width)}"


def generate_login_id() -> str:
    return _next_code("EDU", "login_id_seq")


def generate_member_code() -> str:
    return _next_code("MBR", "member_code_seq")


class UserManager(SoftDeleteManager, BaseUserManager):
    """Combines soft-delete-aware queryset filtering (User.objects excludes
    deleted_at rows, same as every other tenant model) with the manager
    interface Django's auth system requires (create_user/create_superuser).
    """

    use_in_migrations = True

    def _create(self, *, password: str, **extra_fields):
        extra_fields.setdefault("login_id", generate_login_id())
        extra_fields.setdefault("member_code", generate_member_code())
        user = self.model(**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, *, password: str, **extra_fields):
        extra_fields.setdefault("status", "pending")
        return self._create(password=password, **extra_fields)

    def create_superuser(self, *, password: str, **extra_fields):
        # Not wired to `manage.py createsuperuser` (no is_staff/is_superuser
        # in this schema — "super admin" is an RBAC role, not a user flag).
        # Kept only so BaseUserManager's contract is fully satisfied; real
        # bootstrap happens in `manage.py create_super_admin`.
        extra_fields.setdefault("status", "active")
        return self._create(password=password, **extra_fields)
