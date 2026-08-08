"""API-level tests for SubscriptionPlanViewSet — real login (not just ORM
objects), same reasoning as foundation/tests/test_organizations.py:
HasModulePermission reads from request.user, and `billing` is granted to
no org role at all (see permissions_catalog.py's docstring on it) — only a
system-level role (super_admin) can ever reach these endpoints, via
user_has_permission()'s platform-role bypass rather than a per-module grant.

Fixture setup goes through the auth_bypass_rls alias throughout — see
finance/tests/test_finance.py's module docstring for why, under
`transaction=True`, this is what's needed.
"""

import uuid

import pytest
from django.db import transaction as db_transaction
from rest_framework.test import APIClient

from billing.models import SubscriptionPlan
from common.context import apply_org_context
from foundation.models import Organization, Role, User, UserRole

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org(**kwargs):
    org_id = uuid.uuid4()
    kwargs.setdefault("name", "Org")
    kwargs.setdefault("slug", f"org-billing-test-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("email", "a@example.com")
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(id=org_id, **kwargs)


def _make_super_admin_login(client, org, phone):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Super", last_name="Admin", password="pw123456", phone=phone, status="active",
    )
    system_role = Role.objects.using(BYPASS_ALIAS).filter(organization__isnull=True, slug="super_admin").first()
    if system_role is None:
        system_role = Role.objects.using(BYPASS_ALIAS).create(
            organization=None, name="Super Admin", slug="super_admin", is_system=True
        )
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=system_role, organization=org)
    response = client.post("/api/v1/auth/login/", {"login_id": user.login_id, "password": "pw123456"}, format="json")
    assert response.status_code == 200
    return user


def _make_center_admin_login(client, org, phone):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="C", last_name="Admin", password="pw123456", phone=phone, status="active",
    )
    role = Role.objects.using(BYPASS_ALIAS).get(organization=org, slug="center_admin")
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=role, organization=org)
    response = client.post("/api/v1/auth/login/", {"login_id": user.login_id, "password": "pw123456"}, format="json")
    assert response.status_code == 200
    return user


def _make_plan(**kwargs):
    kwargs.setdefault("name", "Test Plan")
    kwargs.setdefault("slug", f"test-plan-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("price", "99.00")
    return SubscriptionPlan.objects.using(BYPASS_ALIAS).create(**kwargs)


def test_the_six_seeded_tiers_exist():
    """Sanity check on billing/migrations/0004_seed_plans.py's data seed —
    not a migration-runner test, just confirms the expected slugs are there
    for foundation/migrations/0010_organization_subscription_plan_fk.py's
    string->FK mapping to have matched against."""
    slugs = set(SubscriptionPlan.objects.values_list("slug", flat=True))
    assert {"free", "starter", "basic", "pro", "enterprise", "custom"}.issubset(slugs)


def test_super_admin_can_create_a_plan():
    org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, org, "+998900800001")

    slug = f"growth-{uuid.uuid4().hex[:8]}"
    response = client.post(
        "/api/v1/billing/subscription-plans/",
        {"name": "Growth", "slug": slug, "price": "149.00", "billing_cycle": "monthly",
         "max_branches": 5, "max_students": 800, "max_teachers": 40, "features": ["A", "B"]},
        format="json",
    )

    assert response.status_code == 201
    body = response.json()["data"]
    assert body["name"] == "Growth"
    assert body["active_count"] == 0


def test_created_plan_is_appended_after_existing_ones_by_default():
    """No display_order field on the create form — without a server-side
    default, every new plan would land at display_order=0 and sort
    intermixed with (or ahead of) the seeded tiers via
    Meta.ordering = ["display_order", "price"]."""
    highest_existing = SubscriptionPlan.objects.order_by("-display_order").values_list("display_order", flat=True).first() or 0
    org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, org, "+998900800005")

    response = client.post(
        "/api/v1/billing/subscription-plans/",
        {"name": "Appended", "slug": f"appended-{uuid.uuid4().hex[:8]}", "price": "10.00"},
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["data"]["display_order"] > highest_existing


def test_negative_price_is_rejected():
    org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, org, "+998900800006")

    response = client.post(
        "/api/v1/billing/subscription-plans/",
        {"name": "Bad", "slug": f"bad-{uuid.uuid4().hex[:8]}", "price": "-50.00"},
        format="json",
    )

    assert response.status_code == 400


def test_center_admin_cannot_manage_plans():
    org = _make_org()
    client = APIClient()
    _make_center_admin_login(client, org, "+998900800002")

    list_response = client.get("/api/v1/billing/subscription-plans/")
    create_response = client.post(
        "/api/v1/billing/subscription-plans/", {"name": "X", "slug": "x-plan", "price": "1"}, format="json"
    )

    assert list_response.status_code == 403
    assert create_response.status_code == 403


def test_active_count_reflects_assigned_organizations():
    plan = _make_plan()
    _make_org(subscription_plan=plan)
    _make_org(subscription_plan=plan)
    _make_org()  # unrelated org, no plan assigned — must not be counted

    admin_org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, admin_org, "+998900800003")

    response = client.get(f"/api/v1/billing/subscription-plans/{plan.id}/")

    assert response.status_code == 200
    assert response.json()["data"]["active_count"] == 2


def test_deleting_a_plan_soft_deletes_not_hard_deletes():
    plan = _make_plan()
    org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, org, "+998900800004")

    response = client.delete(f"/api/v1/billing/subscription-plans/{plan.id}/")

    assert response.status_code == 200
    assert not SubscriptionPlan.objects.using(BYPASS_ALIAS).filter(id=plan.id).exists()
    assert SubscriptionPlan.all_objects.using(BYPASS_ALIAS).get(id=plan.id).deleted_at is not None


def test_organization_can_be_assigned_a_dynamic_plan():
    """Covers the foundation.Organization.subscription_plan FK end of this
    feature, not just the billing app's own ViewSet."""
    plan = _make_plan(name="Bespoke")
    org = _make_org(subscription_plan=plan)

    org.refresh_from_db(using=BYPASS_ALIAS)

    assert org.subscription_plan_id == plan.id


def test_organization_with_no_plan_assigned_is_valid():
    org = _make_org()
    org.refresh_from_db(using=BYPASS_ALIAS)
    assert org.subscription_plan_id is None
