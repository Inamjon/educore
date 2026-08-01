import pytest

from common.permissions import user_has_permission
from foundation.models import Organization, Permission, Role, RolePermission, User, UserRole

pytestmark = pytest.mark.django_db


def test_org_scoped_role_grants_only_its_own_permissions():
    org = Organization.objects.create(name="Org", slug="org-1", email="a@example.com")
    user = User.objects.create_user(
        organization=org, first_name="A", last_name="B", password="pw123456", email="a.b@example.com"
    )

    role = Role.objects.create(organization=org, name="Center Admin", slug="center_admin")
    perm = Permission.objects.create(module="students", action="create")
    RolePermission.objects.create(role=role, permission=perm)
    UserRole.objects.create(user=user, role=role, organization=org)

    assert user_has_permission(user, "students", "create") is True
    assert user_has_permission(user, "students", "delete") is False


def test_system_level_role_grants_everything():
    org = Organization.objects.create(name="Platform", slug="platform-1", email="a@example.com")
    user = User.objects.create_user(
        organization=org, first_name="Super", last_name="Admin", password="pw123456", email="super.admin@example.com"
    )

    system_role = Role.objects.create(organization=None, name="Super Admin", slug="super_admin", is_system=True)
    UserRole.objects.create(user=user, role=system_role, organization=org)

    # No RolePermission rows exist at all for this role, yet access is granted —
    # system-level roles bypass the granular check (see common/permissions.py).
    assert user_has_permission(user, "anything", "whatsoever") is True


def test_unauthenticated_user_has_no_permission():
    assert user_has_permission(None, "students", "view") is False
