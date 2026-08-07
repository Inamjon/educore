"""API-level tests for PaymeWebhookView — real HTTP POSTs, no login (Payme's
servers call this directly, authenticated only by HTTP Basic). Same
`databases=[...], transaction=True` reasoning as
attendance/tests/test_attendance_authorization.py: the view itself calls
common.context.apply_org_context, which needs a real open transaction, and
looks the gateway account up via the auth_bypass_rls alias — under
`transaction=True`, writes made through that alias must actually commit to
be visible to the (separate connection) "default" alias the view/RLS uses,
which is exactly what `transaction=True` (vs. the default rollback-per-test
wrapping) provides.

Fixture setup and pure DB-state assertions below go through the
auth_bypass_rls alias throughout (mirrors payment_gateways/views.py's own
BYPASS_ALIAS use for the identical "no org context exists yet" problem);
only `build_checkout_url` (called directly here, not through the API) and
the webhook POSTs themselves exercise real RLS, matching what Payme/Click
actually trigger in production.
"""

import base64
import uuid

import pytest
from django.db import transaction as db_transaction
from rest_framework.test import APIClient

from common.context import apply_org_context
from finance.models import Invoice, Payment
from finance.numbering import generate_invoice_number
from foundation.models import Organization, User
from payment_gateways.models import PaymentGatewayAccount
from payment_gateways.services.checkout import build_checkout_url
from student.models import StudentProfile

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"
SECRET = "payme-secret-xyz"


def _make_org():
    org_id = uuid.uuid4()
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(
            id=org_id, name="Org", slug=f"org-payme-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
        )


def _make_invoice(org, total_amount="100000.00"):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="S", last_name="Student", password="pw123456",
        phone=f"+998999{uuid.uuid4().hex[:6]}",
    )
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(
        organization=org, user=user, student_code=f"STU-{uuid.uuid4().hex[:6]}"
    )
    with db_transaction.atomic():
        apply_org_context(str(org.id))
        invoice_number = generate_invoice_number(Invoice, org)
    invoice = Invoice.objects.using(BYPASS_ALIAS).create(
        organization=org, student_profile=student, invoice_number=invoice_number,
        total_amount=total_amount, due_date="2026-09-30",
    )
    invoice.refresh_from_db(using=BYPASS_ALIAS)
    return invoice


def _make_gateway_account(org):
    return PaymentGatewayAccount.objects.using(BYPASS_ALIAS).create(
        organization=org, provider="payme", merchant_id="payme-merchant", secret_key=SECRET
    )


def _checkout(invoice, provider="payme"):
    with db_transaction.atomic():
        apply_org_context(str(invoice.organization_id))
        return build_checkout_url(invoice, provider)


def _invoice_status(invoice):
    return Invoice.objects.using(BYPASS_ALIAS).get(pk=invoice.id).status


def _payment_count(invoice, **filters):
    return Payment.objects.using(BYPASS_ALIAS).filter(invoice=invoice, **filters).count()


def _auth_header():
    token = base64.b64encode(f"Paycom:{SECRET}".encode()).decode()
    return f"Basic {token}"


def _post(client, gateway_account, method, params, rpc_id=1, auth=None):
    return client.post(
        f"/api/v1/payment-gateways/webhooks/payme/{gateway_account.id}/",
        {"method": method, "params": params, "id": rpc_id},
        format="json",
        HTTP_AUTHORIZATION=auth if auth is not None else _auth_header(),
    )


def test_wrong_basic_auth_is_rejected():
    org = _make_org()
    invoice = _make_invoice(org)
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)

    response = _post(
        client=APIClient(), gateway_account=account, method="CheckPerformTransaction",
        params={"amount": int(invoice.total_amount * 100), "account": {"merchant_trans_id": txn.merchant_trans_id}},
        auth="Basic " + base64.b64encode(b"Paycom:wrong-secret").decode(),
    )

    assert response.status_code == 200
    assert response.json()["error"]["code"] == -32504


def test_check_perform_transaction_allows_valid_order():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)

    response = _post(
        APIClient(), account, "CheckPerformTransaction",
        {"amount": 10000000, "account": {"merchant_trans_id": txn.merchant_trans_id}},
    )

    assert response.status_code == 200
    assert response.json()["result"] == {"allow": True}


def test_check_perform_transaction_rejects_amount_mismatch():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)

    response = _post(
        APIClient(), account, "CheckPerformTransaction",
        {"amount": 1, "account": {"merchant_trans_id": txn.merchant_trans_id}},
    )

    assert response.json()["error"]["code"] == -31001


def test_full_payme_flow_creates_payment_and_updates_invoice():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)
    client = APIClient()
    provider_id = uuid.uuid4().hex

    create_response = _post(
        client, account, "CreateTransaction",
        {"id": provider_id, "time": 0, "amount": 10000000, "account": {"merchant_trans_id": txn.merchant_trans_id}},
    )
    assert create_response.json()["result"]["state"] == 1

    perform_response = _post(client, account, "PerformTransaction", {"id": provider_id})
    assert perform_response.json()["result"]["state"] == 2

    assert _invoice_status(invoice) == "paid"
    assert _payment_count(invoice, payment_method="payme") == 1


def test_perform_transaction_is_idempotent_on_replay():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)
    client = APIClient()
    provider_id = uuid.uuid4().hex

    _post(client, account, "CreateTransaction", {"id": provider_id, "time": 0, "amount": 10000000, "account": {"merchant_trans_id": txn.merchant_trans_id}})
    _post(client, account, "PerformTransaction", {"id": provider_id})
    second = _post(client, account, "PerformTransaction", {"id": provider_id})

    assert second.json()["result"]["state"] == 2
    assert _payment_count(invoice, payment_method="payme") == 1


def test_cancel_after_perform_soft_deletes_payment_and_reverts_invoice():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)
    client = APIClient()
    provider_id = uuid.uuid4().hex

    _post(client, account, "CreateTransaction", {"id": provider_id, "time": 0, "amount": 10000000, "account": {"merchant_trans_id": txn.merchant_trans_id}})
    _post(client, account, "PerformTransaction", {"id": provider_id})
    cancel_response = _post(client, account, "CancelTransaction", {"id": provider_id, "reason": 1})

    assert cancel_response.json()["result"]["state"] == -2
    assert _invoice_status(invoice) == "pending"
    assert _payment_count(invoice) == 0
    assert Payment.all_objects.using(BYPASS_ALIAS).filter(invoice=invoice).exists()


def test_create_transaction_for_unknown_order_returns_account_not_found():
    org = _make_org()
    account = _make_gateway_account(org)

    response = _post(
        APIClient(), account, "CreateTransaction",
        {"id": "x", "time": 0, "amount": 1, "account": {"merchant_trans_id": "does-not-exist"}},
    )

    assert response.json()["error"]["code"] == -31050


def test_unknown_method_returns_method_not_found():
    org = _make_org()
    account = _make_gateway_account(org)

    response = _post(APIClient(), account, "SomeUnknownMethod", {})

    assert response.json()["error"]["code"] == -32601
