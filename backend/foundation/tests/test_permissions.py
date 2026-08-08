"""See finance/tests/test_finance.py's module docstring for why fixture
setup goes through the auth_bypass_rls alias under `transaction=True`.
"""

import uuid

import pytest
from django.db import transaction as db_transaction

from common.context import apply_org_context
from common.permissions import user_has_permission
from foundation.models import Organization, Permission, Role, RolePermission, User, UserRole

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org(**kwargs):
    org_id = uuid.uuid4()
    kwargs.setdefault("name", "Org")
    kwargs.setdefault("slug", f"org-perm-test-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("email", "a@example.com")
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(id=org_id, **kwargs)


def _check_permission(org, user, module, action):
    # user_has_permission is real application code — queries UserRole via
    # the *default* connection, so (unlike the BYPASSRLS-backed fixture
    # helpers above) it needs a live, matching org context.
    with db_transaction.atomic():
        apply_org_context(str(org.id))
        return user_has_permission(user, module, action)


def test_org_scoped_role_grants_only_its_own_permissions():
    org = _make_org()
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="A", last_name="B", password="pw123456", phone=f"+998901{uuid.uuid4().hex[:6]}"
    )

    # A custom slug, not one of the auto-provisioned defaults (center_admin/
    # teacher/student — see foundation/signals.py) — keeps this test's
    # coverage of arbitrary role+permission combos independent of what the
    # org-creation signal happens to seed.
    role = Role.objects.using(BYPASS_ALIAS).create(organization=org, name="Custom Role", slug="custom_role")
    # get_or_create, not create: the RBAC catalog data migration
    # (foundation/migrations/0007_seed_permissions.py) already seeds this
    # exact (module, action) pair.
    perm, _created = Permission.objects.using(BYPASS_ALIAS).get_or_create(module="students", action="create")
    RolePermission.objects.using(BYPASS_ALIAS).create(role=role, permission=perm)
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=role, organization=org)

    assert _check_permission(org, user, "students", "create") is True
    assert _check_permission(org, user, "students", "delete") is False


def test_system_level_role_grants_everything():
    org = _make_org()
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Super", last_name="Admin", password="pw123456", phone=f"+998901{uuid.uuid4().hex[:6]}"
    )

    system_role = Role.objects.using(BYPASS_ALIAS).create(
        organization=None, name="Super Admin", slug=f"super_admin_{uuid.uuid4().hex[:6]}", is_system=True
    )
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=system_role, organization=org)

    # No RolePermission rows exist at all for this role, yet access is granted —
    # system-level roles bypass the granular check (see common/permissions.py).
    assert _check_permission(org, user, "anything", "whatsoever") is True


def test_unauthenticated_user_has_no_permission():
    assert user_has_permission(None, "students", "view") is False
