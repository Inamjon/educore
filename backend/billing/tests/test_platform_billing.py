"""Model/service-level tests for billing.PlatformInvoice/PlatformPayment
(EduCore's own bill to an organization — platform <-> organization, not
finance.Invoice's organization <-> student) plus API-level authorization —
same "real login" reasoning as billing/tests/test_subscription_plan.py.

Fixture setup goes through the auth_bypass_rls alias throughout — see
finance/tests/test_finance.py's module docstring for why, under
`transaction=True`, this is what's needed.
"""

import uuid

import pytest
from django.db import transaction as db_transaction
from rest_framework.test import APIClient

from billing.models import PlatformInvoice, PlatformPayment, SubscriptionPlan
from billing.services import platform_invoice_balance, recompute_platform_invoice_status
from common.context import apply_org_context
from foundation.models import Organization, Role, User, UserRole

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org(**kwargs):
    org_id = uuid.uuid4()
    kwargs.setdefault("name", "Org")
    kwargs.setdefault("slug", f"org-platform-billing-test-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("email", "a@example.com")
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(id=org_id, **kwargs)


def _make_plan(**kwargs):
    kwargs.setdefault("name", "Test Plan")
    kwargs.setdefault("slug", f"pb-test-plan-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("price", "100.00")
    return SubscriptionPlan.objects.using(BYPASS_ALIAS).create(**kwargs)


def _make_invoice(org, plan, **kwargs):
    # NOT generate_platform_invoice_number() here — that function deliberately
    # scans PlatformInvoice *platform-wide* (no organization filter, unlike
    # finance.numbering's per-org version), which only resolves under RLS
    # when the caller satisfies is_platform_user() (a real super_admin
    # request). A model-level fixture with no such request context would
    # see current_org_id unset and 500. A locally-unique fake number is
    # enough for tests that aren't specifically about the numbering
    # function itself — see test_platform_invoice_numbers_are_sequential_and_unique
    # below, which exercises the real thing through the actual API.
    kwargs.setdefault("invoice_number", f"PINV-TEST-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("amount", "100.00")
    kwargs.setdefault("period_start", "2026-08-01")
    kwargs.setdefault("period_end", "2026-09-01")
    kwargs.setdefault("due_date", "2026-08-15")
    invoice = PlatformInvoice.objects.using(BYPASS_ALIAS).create(organization=org, subscription_plan=plan, **kwargs)
    # .create() leaves `amount` as the raw string passed in (Decimal fields
    # aren't coerced on plain assignment, only on a DB round-trip) —
    # refresh so recompute_platform_invoice_status()'s Decimal comparisons
    # against it don't blow up with a str.
    invoice.refresh_from_db(using=BYPASS_ALIAS)
    return invoice


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


def test_platform_invoice_numbers_are_sequential_and_unique():
    """Exercises the real generate_platform_invoice_number() through an
    actual super_admin request (its RLS-scoped, platform-wide scan of
    PlatformInvoice only resolves under is_platform_user() — see
    _make_invoice()'s comment above for why this can't be called directly
    at the model level without one)."""
    org = _make_org()
    plan = _make_plan()
    client = APIClient()
    _make_super_admin_login(client, org, "+998900810005")
    payload = {
        "organization": str(org.id), "subscription_plan": str(plan.id), "amount": "10.00",
        "period_start": "2026-08-01", "period_end": "2026-09-01", "due_date": "2026-08-15",
    }

    first = client.post("/api/v1/billing/platform-invoices/", payload, format="json").json()["data"]["invoice_number"]
    second = client.post("/api/v1/billing/platform-invoices/", payload, format="json").json()["data"]["invoice_number"]

    assert first != second
    assert first.startswith("PINV-")
    assert second.startswith("PINV-")


def test_recompute_status_transitions_pending_to_partial_to_paid():
    org = _make_org()
    plan = _make_plan()
    invoice = _make_invoice(org, plan, amount="100.00")

    recompute_platform_invoice_status(invoice)
    assert invoice.status == "pending"

    PlatformPayment.objects.using(BYPASS_ALIAS).create(
        organization=org, platform_invoice=invoice, amount="40.00", method="bank_transfer"
    )
    recompute_platform_invoice_status(invoice)
    assert invoice.status == "partially_paid"
    assert platform_invoice_balance(invoice) == 60

    PlatformPayment.objects.using(BYPASS_ALIAS).create(
        organization=org, platform_invoice=invoice, amount="60.00", method="bank_transfer"
    )
    recompute_platform_invoice_status(invoice)
    assert invoice.status == "paid"
    assert platform_invoice_balance(invoice) == 0


def test_super_admin_can_create_invoice_and_record_payment():
    org = _make_org()
    plan = _make_plan(price="150.00")
    admin_org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, admin_org, "+998900810001")

    invoice_response = client.post(
        "/api/v1/billing/platform-invoices/",
        {
            "organization": str(org.id), "subscription_plan": str(plan.id), "amount": "150.00",
            "period_start": "2026-08-01", "period_end": "2026-09-01", "due_date": "2026-08-15",
        },
        format="json",
    )
    assert invoice_response.status_code == 201
    invoice_id = invoice_response.json()["data"]["id"]
    assert invoice_response.json()["data"]["status"] == "pending"

    payment_response = client.post(
        "/api/v1/billing/platform-payments/",
        {"platform_invoice": invoice_id, "amount": "150.00", "method": "bank_transfer", "reference_note": "wire #123"},
        format="json",
    )
    assert payment_response.status_code == 201
    assert payment_response.json()["data"]["organization"] == str(org.id)

    invoice_check = client.get(f"/api/v1/billing/platform-invoices/{invoice_id}/")
    assert invoice_check.json()["data"]["status"] == "paid"
    assert float(invoice_check.json()["data"]["balance"]) == 0


def test_center_admin_cannot_manage_platform_invoices():
    org = _make_org()
    client = APIClient()
    _make_center_admin_login(client, org, "+998900810002")

    response = client.get("/api/v1/billing/platform-invoices/")

    assert response.status_code == 403


def test_payment_rejected_when_amount_exceeds_remaining_balance():
    org = _make_org()
    plan = _make_plan()
    invoice = _make_invoice(org, plan, amount="100.00")
    client = APIClient()
    _make_super_admin_login(client, org, "+998900810003")

    response = client.post(
        "/api/v1/billing/platform-payments/",
        {"platform_invoice": str(invoice.id), "amount": "150.00", "method": "cash"},
        format="json",
    )

    assert response.status_code == 400


def test_deleting_a_payment_recomputes_invoice_status_back_down():
    org = _make_org()
    plan = _make_plan()
    invoice = _make_invoice(org, plan, amount="100.00")
    client = APIClient()
    _make_super_admin_login(client, org, "+998900810004")

    create = client.post(
        "/api/v1/billing/platform-payments/",
        {"platform_invoice": str(invoice.id), "amount": "100.00", "method": "cash"},
        format="json",
    )
    payment_id = create.json()["data"]["id"]
    invoice.refresh_from_db(using=BYPASS_ALIAS)
    assert invoice.status == "paid"

    client.delete(f"/api/v1/billing/platform-payments/{payment_id}/")

    invoice.refresh_from_db(using=BYPASS_ALIAS)
    assert invoice.status == "pending"
    assert not PlatformPayment.objects.using(BYPASS_ALIAS).filter(id=payment_id).exists()
    assert PlatformPayment.all_objects.using(BYPASS_ALIAS).get(id=payment_id).deleted_at is not None
