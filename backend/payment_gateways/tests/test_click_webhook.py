"""API-level tests for ClickWebhookView — real HTTP POSTs, no login (Click's
servers call this directly, authenticated only by `sign_string`). Same
`databases=[...], transaction=True` reasoning as test_payme_webhook.py —
fixture setup and pure DB-state assertions go through the auth_bypass_rls
alias throughout; only `build_checkout_url` (called directly here) and the
webhook POSTs themselves exercise real RLS.
"""

import hashlib
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
SECRET = "click-secret-abc"
SERVICE_ID = "svc-42"


def _make_org():
    org_id = uuid.uuid4()
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(
            id=org_id, name="Org", slug=f"org-click-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
        )


def _make_invoice(org, total_amount="100000.00"):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="S", last_name="Student", password="pw123456",
        phone=f"+998998{uuid.uuid4().hex[:6]}",
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
        organization=org, provider="click", merchant_id="click-merchant", service_id=SERVICE_ID, secret_key=SECRET
    )


def _checkout(invoice, provider="click"):
    with db_transaction.atomic():
        apply_org_context(str(invoice.organization_id))
        return build_checkout_url(invoice, provider)


def _invoice_status(invoice):
    return Invoice.objects.using(BYPASS_ALIAS).get(pk=invoice.id).status


def _payment_count(invoice, **filters):
    return Payment.objects.using(BYPASS_ALIAS).filter(invoice=invoice, **filters).count()


def _sign(click_trans_id, merchant_trans_id, amount, action, sign_time="1700000000", merchant_prepare_id=None, secret=SECRET):
    parts = [str(click_trans_id), SERVICE_ID, secret, str(merchant_trans_id)]
    if action == "1":
        parts.append(str(merchant_prepare_id or ""))
    parts += [str(amount), action, sign_time]
    return hashlib.md5("".join(parts).encode()).hexdigest()


def _post(client, gateway_account, params):
    return client.post(f"/api/v1/payment-gateways/webhooks/click/{gateway_account.id}/", params, format="json")


def test_invalid_signature_is_rejected():
    org = _make_org()
    invoice = _make_invoice(org)
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)
    click_trans_id = uuid.uuid4().hex

    response = _post(APIClient(), account, {
        "click_trans_id": click_trans_id, "service_id": SERVICE_ID, "merchant_trans_id": txn.merchant_trans_id,
        "amount": str(invoice.total_amount), "action": "0", "sign_time": "1700000000", "sign_string": "bogus",
    })

    assert response.status_code == 200
    assert response.json()["error"] == -1


def test_prepare_happy_path():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)
    click_trans_id = uuid.uuid4().hex
    amount = str(invoice.total_amount)

    sign = _sign(click_trans_id=click_trans_id, merchant_trans_id=txn.merchant_trans_id, amount=amount, action="0")
    response = _post(APIClient(), account, {
        "click_trans_id": click_trans_id, "service_id": SERVICE_ID, "merchant_trans_id": txn.merchant_trans_id,
        "amount": amount, "action": "0", "sign_time": "1700000000", "sign_string": sign,
    })

    body = response.json()
    assert body["error"] == 0
    assert body["merchant_prepare_id"]


def test_full_click_flow_creates_payment_and_updates_invoice():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)
    click_trans_id = uuid.uuid4().hex
    amount = str(invoice.total_amount)
    client = APIClient()

    prepare_sign = _sign(click_trans_id=click_trans_id, merchant_trans_id=txn.merchant_trans_id, amount=amount, action="0")
    prepare = _post(client, account, {
        "click_trans_id": click_trans_id, "service_id": SERVICE_ID, "merchant_trans_id": txn.merchant_trans_id,
        "amount": amount, "action": "0", "sign_time": "1700000000", "sign_string": prepare_sign,
    })
    merchant_prepare_id = prepare.json()["merchant_prepare_id"]

    complete_sign = _sign(
        click_trans_id=click_trans_id, merchant_trans_id=txn.merchant_trans_id, amount=amount, action="1",
        merchant_prepare_id=merchant_prepare_id,
    )
    complete = _post(client, account, {
        "click_trans_id": click_trans_id, "service_id": SERVICE_ID, "merchant_trans_id": txn.merchant_trans_id,
        "merchant_prepare_id": merchant_prepare_id, "amount": amount, "action": "1", "error": 0,
        "sign_time": "1700000000", "sign_string": complete_sign,
    })

    assert complete.json()["error"] == 0
    assert _invoice_status(invoice) == "paid"
    assert _payment_count(invoice, payment_method="click") == 1


def test_complete_is_idempotent_on_replay():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)
    click_trans_id = uuid.uuid4().hex
    amount = str(invoice.total_amount)
    client = APIClient()

    prepare_sign = _sign(click_trans_id=click_trans_id, merchant_trans_id=txn.merchant_trans_id, amount=amount, action="0")
    prepare = _post(client, account, {
        "click_trans_id": click_trans_id, "service_id": SERVICE_ID, "merchant_trans_id": txn.merchant_trans_id,
        "amount": amount, "action": "0", "sign_time": "1700000000", "sign_string": prepare_sign,
    })
    merchant_prepare_id = prepare.json()["merchant_prepare_id"]
    complete_sign = _sign(
        click_trans_id=click_trans_id, merchant_trans_id=txn.merchant_trans_id, amount=amount, action="1",
        merchant_prepare_id=merchant_prepare_id,
    )
    complete_params = {
        "click_trans_id": click_trans_id, "service_id": SERVICE_ID, "merchant_trans_id": txn.merchant_trans_id,
        "merchant_prepare_id": merchant_prepare_id, "amount": amount, "action": "1", "error": 0,
        "sign_time": "1700000000", "sign_string": complete_sign,
    }
    _post(client, account, complete_params)
    second = _post(client, account, complete_params)

    assert second.json()["error"] == 0
    assert _payment_count(invoice, payment_method="click") == 1


def test_click_side_failure_does_not_credit_invoice():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)
    click_trans_id = uuid.uuid4().hex
    amount = str(invoice.total_amount)
    client = APIClient()

    prepare_sign = _sign(click_trans_id=click_trans_id, merchant_trans_id=txn.merchant_trans_id, amount=amount, action="0")
    prepare = _post(client, account, {
        "click_trans_id": click_trans_id, "service_id": SERVICE_ID, "merchant_trans_id": txn.merchant_trans_id,
        "amount": amount, "action": "0", "sign_time": "1700000000", "sign_string": prepare_sign,
    })
    merchant_prepare_id = prepare.json()["merchant_prepare_id"]

    complete_sign = _sign(
        click_trans_id=click_trans_id, merchant_trans_id=txn.merchant_trans_id, amount=amount, action="1",
        merchant_prepare_id=merchant_prepare_id,
    )
    complete = _post(client, account, {
        "click_trans_id": click_trans_id, "service_id": SERVICE_ID, "merchant_trans_id": txn.merchant_trans_id,
        "merchant_prepare_id": merchant_prepare_id, "amount": amount, "action": "1", "error": -9,
        "error_note": "Cancelled by user", "sign_time": "1700000000", "sign_string": complete_sign,
    })

    assert complete.json()["error"] == -9
    assert _invoice_status(invoice) == "pending"
    assert _payment_count(invoice) == 0


def test_prepare_rejects_amount_mismatch():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    account = _make_gateway_account(org)
    txn, _ = _checkout(invoice)
    click_trans_id = uuid.uuid4().hex

    sign = _sign(click_trans_id=click_trans_id, merchant_trans_id=txn.merchant_trans_id, amount="1.00", action="0")
    response = _post(APIClient(), account, {
        "click_trans_id": click_trans_id, "service_id": SERVICE_ID, "merchant_trans_id": txn.merchant_trans_id,
        "amount": "1.00", "action": "0", "sign_time": "1700000000", "sign_string": sign,
    })

    assert response.json()["error"] == -2
