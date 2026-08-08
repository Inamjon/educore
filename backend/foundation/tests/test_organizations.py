"""API-level tests for OrganizationViewSet.get_queryset()'s explicit
scoping — Organization has no RLS/tenant scoping of its own (it IS the
tenant root), so this is Python-level, not RLS-backed like every other
ViewSet's isolation. Same "real login" reasoning as
attendance/tests/test_attendance_authorization.py.

Fixture setup goes through the auth_bypass_rls alias throughout — see
finance/tests/test_finance.py's module docstring for why, under
`transaction=True`, this is what's needed.
"""

import uuid

import pytest
from django.db import connection, transaction as db_transaction
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from billing.models import SubscriptionPlan
from common.context import apply_org_context
from foundation.models import Organization, Role, User, UserRole

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org(**kwargs):
    org_id = uuid.uuid4()
    kwargs.setdefault("name", "Org")
    kwargs.setdefault("slug", f"org-orgtest-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("email", "a@example.com")
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(id=org_id, **kwargs)


def _login(client, user):
    response = client.post("/api/v1/auth/login/", {"login_id": user.login_id, "password": "pw123456"}, format="json")
    assert response.status_code == 200
    return response


def test_center_admin_only_sees_own_organization():
    org_a = _make_org()
    org_b = _make_org()
    admin_a = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org_a, first_name="A", last_name="Admin", password="pw123456", phone="+998900700001", status="active",
    )
    role_a = Role.objects.using(BYPASS_ALIAS).get(organization=org_a, slug="center_admin")
    UserRole.objects.using(BYPASS_ALIAS).create(user=admin_a, role=role_a, organization=org_a)

    client = APIClient()
    _login(client, admin_a)
    response = client.get("/api/v1/organizations/")
    assert response.status_code == 200
    org_ids = [row["id"] for row in response.json()["data"]["results"]]
    assert org_ids == [str(org_a.id)]
    assert str(org_b.id) not in org_ids


def test_super_admin_sees_every_organization():
    org_a = _make_org()
    org_b = _make_org()
    super_admin = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org_a, first_name="Super", last_name="Admin", password="pw123456", phone="+998900700002", status="active",
    )
    system_role = Role.objects.using(BYPASS_ALIAS).filter(organization__isnull=True, slug="super_admin").first()
    if system_role is None:
        system_role = Role.objects.using(BYPASS_ALIAS).create(organization=None, name="Super Admin", slug="super_admin", is_system=True)
    UserRole.objects.using(BYPASS_ALIAS).create(user=super_admin, role=system_role, organization=org_a)

    client = APIClient()
    _login(client, super_admin)
    response = client.get("/api/v1/organizations/")
    assert response.status_code == 200
    org_ids = {row["id"] for row in response.json()["data"]["results"]}
    assert {str(org_a.id), str(org_b.id)}.issubset(org_ids)


def test_listing_organizations_does_not_n_plus_one_on_subscription_plan():
    """OrganizationSerializer.subscription_plan_detail nests a related
    SubscriptionPlan — without select_related("subscription_plan") on the
    queryset, each row would issue its own extra query."""
    plan = SubscriptionPlan.objects.using(BYPASS_ALIAS).create(name="Test Plan", slug=f"n1-test-{uuid.uuid4().hex[:8]}")
    org_a = _make_org(subscription_plan=plan)
    org_b = _make_org(subscription_plan=plan)
    super_admin = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org_a, first_name="Super", last_name="Admin", password="pw123456", phone="+998900700003", status="active",
    )
    system_role = Role.objects.using(BYPASS_ALIAS).filter(organization__isnull=True, slug="super_admin").first()
    if system_role is None:
        system_role = Role.objects.using(BYPASS_ALIAS).create(organization=None, name="Super Admin", slug="super_admin", is_system=True)
    UserRole.objects.using(BYPASS_ALIAS).create(user=super_admin, role=system_role, organization=org_a)

    client = APIClient()
    _login(client, super_admin)
    with CaptureQueriesContext(connection) as ctx:
        response = client.get("/api/v1/organizations/")
    assert response.status_code == 200

    # select_related() folds subscription_plan into the organizations query
    # as a JOIN (its SQL mentions "subscription_plans" as a joined table,
    # e.g. `LEFT OUTER JOIN "billing"."subscription_plans"`) rather than a
    # separate `... FROM "billing"."subscription_plans" ...` query per row —
    # that's the distinction checked here, not "no mention at all".
    standalone_plan_queries = [q for q in ctx.captured_queries if 'FROM "billing"."subscription_plans"' in q["sql"]]
    assert len(standalone_plan_queries) == 0, standalone_plan_queries

    org_ids = {row["id"] for row in response.json()["data"]["results"]}
    assert {str(org_a.id), str(org_b.id)}.issubset(org_ids)
