"""API-level tests for PaymentGatewayAccountViewSet — real login (not just
ORM objects), same reasoning as attendance/tests/test_attendance_authorization.py:
HasModulePermission reads from request.user, and role/permission grants only
exist once foundation.signals's post_save provisioning has actually run.

Fixture setup and pure DB-state assertions go through the auth_bypass_rls
alias throughout (see test_payme_webhook.py's module docstring for why,
under `transaction=True`, this is what makes cross-connection writes/reads
actually visible to each other); only the real HTTP requests exercise RLS.
"""

import uuid

import pytest
from django.db import connections, transaction as db_transaction
from rest_framework.test import APIClient

from common.context import apply_org_context
from foundation.models import Organization, Role, User, UserRole
from payment_gateways.models import PaymentGatewayAccount

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org():
    org_id = uuid.uuid4()
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(
            id=org_id, name="Org", slug=f"org-gwacct-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
        )


def _make_login(client, org, phone, role_slug):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="U", last_name=role_slug, password="pw123456", phone=phone, status="active",
    )
    role = Role.objects.using(BYPASS_ALIAS).get(organization=org, slug=role_slug)
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=role, organization=org)
    response = client.post("/api/v1/auth/login/", {"login_id": user.login_id, "password": "pw123456"}, format="json")
    assert response.status_code == 200
    return user


def _make_admin_login(client, org, phone):
    return _make_login(client, org, phone, "center_admin")


def _make_teacher_login(client, org, phone):
    return _make_login(client, org, phone, "teacher")


def _get_account(account_id):
    return PaymentGatewayAccount.objects.using(BYPASS_ALIAS).get(pk=account_id)


def test_center_admin_can_create_gateway_account_and_secret_is_never_echoed_back():
    org = _make_org()
    client = APIClient()
    _make_admin_login(client, org, "+998901000001")

    response = client.post(
        "/api/v1/payment-gateways/gateway-accounts/",
        {"organization": str(org.id), "provider": "payme", "merchant_id": "mid-123", "secret_key": "super-secret"},
        format="json",
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert "secret_key" not in data
    assert data["has_secret_key"] is True

    stored = _get_account(data["id"])
    assert stored.secret_key == "super-secret"  # decrypts transparently via EncryptedTextField


def test_secret_key_is_encrypted_at_rest():
    org = _make_org()
    client = APIClient()
    _make_admin_login(client, org, "+998901000002")

    response = client.post(
        "/api/v1/payment-gateways/gateway-accounts/",
        {"organization": str(org.id), "provider": "click", "merchant_id": "m1", "service_id": "s1", "secret_key": "click-secret"},
        format="json",
    )
    assert response.status_code == 201
    account_id = response.json()["data"]["id"]

    with connections[BYPASS_ALIAS].cursor() as cursor:
        cursor.execute('SELECT secret_key FROM "payment_gateways"."gateway_accounts" WHERE id = %s', [account_id])
        raw_value = cursor.fetchone()[0]
    assert raw_value != "click-secret"


def test_teacher_cannot_view_gateway_accounts():
    org = _make_org()
    client = APIClient()
    _make_teacher_login(client, org, "+998901000003")

    response = client.get("/api/v1/payment-gateways/gateway-accounts/")

    assert response.status_code == 403


def test_updating_without_secret_key_keeps_existing_secret():
    org = _make_org()
    client = APIClient()
    _make_admin_login(client, org, "+998901000004")

    create_response = client.post(
        "/api/v1/payment-gateways/gateway-accounts/",
        {"organization": str(org.id), "provider": "payme", "merchant_id": "mid-1", "secret_key": "original-secret"},
        format="json",
    )
    account_id = create_response.json()["data"]["id"]

    update_response = client.patch(
        f"/api/v1/payment-gateways/gateway-accounts/{account_id}/", {"is_active": False}, format="json"
    )
    assert update_response.status_code == 200

    stored = _get_account(account_id)
    assert stored.secret_key == "original-secret"
    assert stored.is_active is False


def test_org_isolation_center_admin_only_sees_own_org_accounts():
    org_a = _make_org()
    org_b = _make_org()
    PaymentGatewayAccount.objects.using(BYPASS_ALIAS).create(
        organization=org_b, provider="payme", merchant_id="other-org-mid", secret_key="s"
    )

    client = APIClient()
    _make_admin_login(client, org_a, "+998901000005")

    response = client.get("/api/v1/payment-gateways/gateway-accounts/")

    assert response.status_code == 200
    assert response.json()["data"]["results"] == []
