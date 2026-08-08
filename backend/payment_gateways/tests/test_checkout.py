import base64
import uuid

import pytest
from django.db import transaction as db_transaction
from rest_framework.exceptions import ValidationError

from common.context import apply_org_context
from finance.models import Invoice, Payment
from finance.numbering import generate_invoice_number
from foundation.models import Organization, User
from payment_gateways.models import GatewayTransaction, PaymentGatewayAccount
from payment_gateways.services.checkout import build_checkout_url
from student.models import StudentProfile

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org(**kwargs):
    """Every fixture object here is created via the BYPASSRLS alias — an
    org's own id can't satisfy its RLS policy at insert time (chicken-and-
    egg, same reasoning as payment_gateways/views.py's BYPASS_ALIAS
    comment), and once org context isn't live on the *default* connection,
    nothing scoped to it (student, invoice, gateway account) can be either.
    Keeping every fixture object on the *same* alias also sidesteps Django's
    related-object router rejecting cross-alias FK assignment. Only the
    actual code under test (`build_checkout_url`, real `finance`/
    `payment_gateways` application code) runs against the *default*
    connection with real org context applied — see `_call_with_org_context`.
    """
    org_id = uuid.uuid4()
    kwargs.setdefault("name", "Test Academy")
    kwargs.setdefault("slug", f"test-academy-checkout-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("email", "contact@test-academy.example")
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(id=org_id, **kwargs)


def _make_student(org, **kwargs):
    # .db_manager(), not .using() — create_user() is a custom UserManager
    # method, not a QuerySet method, so .using() (which returns a QuerySet)
    # would lose access to it.
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Sam", last_name="Student", password="pw123456",
        phone=f"+99891{uuid.uuid4().hex[:7]}",
    )
    kwargs.setdefault("student_code", f"STU-{uuid.uuid4().hex[:6]}")
    return StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=user, **kwargs)


def _make_invoice(org, **kwargs):
    kwargs.setdefault("student_profile", _make_student(org))
    if "invoice_number" not in kwargs:
        # generate_invoice_number is real application code (finance/numbering.py)
        # that runs on the *default* connection under `select_for_update()`
        # — needs a live, matching org context, same as `_checkout` below.
        with db_transaction.atomic():
            apply_org_context(str(org.id))
            kwargs["invoice_number"] = generate_invoice_number(Invoice, org)
    kwargs.setdefault("total_amount", "500000.00")
    kwargs.setdefault("due_date", "2026-09-30")
    invoice = Invoice.objects.using(BYPASS_ALIAS).create(organization=org, **kwargs)
    invoice.refresh_from_db(using=BYPASS_ALIAS)
    return invoice


def _make_gateway_account(org, provider="payme", **kwargs):
    kwargs.setdefault("merchant_id", "merchant-abc")
    kwargs.setdefault("secret_key", "s3cr3t")
    if provider == "click":
        kwargs.setdefault("service_id", "service-xyz")
    return PaymentGatewayAccount.objects.using(BYPASS_ALIAS).create(organization=org, provider=provider, **kwargs)


def _checkout(invoice, provider, return_url=None):
    """Runs the real `build_checkout_url` (production code, `default`
    connection) with real org context applied — unlike the BYPASSRLS-backed
    fixture helpers above, this exercises actual RLS enforcement, same as a
    real request would.
    """
    with db_transaction.atomic():
        apply_org_context(str(invoice.organization_id))
        return build_checkout_url(invoice, provider, return_url=return_url)


def test_build_payme_checkout_url_encodes_expected_params():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="150000.00")
    _make_gateway_account(org, provider="payme", merchant_id="payme-merchant-1")

    txn, url = _checkout(invoice, "payme")

    assert txn.status == "initiated"
    assert txn.provider == "payme"
    assert txn.amount == invoice.total_amount
    assert url.startswith("https://checkout.paycom.uz/")
    decoded = base64.b64decode(url.rsplit("/", 1)[-1]).decode()
    assert "m=payme-merchant-1" in decoded
    assert f"ac.merchant_trans_id={txn.merchant_trans_id}" in decoded
    assert "a=15000000" in decoded  # tiyin


def test_build_click_checkout_url_encodes_expected_params():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="200000.00")
    _make_gateway_account(org, provider="click", merchant_id="click-merchant-1", service_id="svc-1")

    txn, url = _checkout(invoice, "click")

    assert url.startswith("https://my.click.uz/services/pay?")
    assert "service_id=svc-1" in url
    assert "merchant_id=click-merchant-1" in url
    assert "amount=200000.00" in url
    assert f"transaction_param={txn.merchant_trans_id}" in url


def test_checkout_rejected_when_invoice_fully_paid():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    Payment.objects.using(BYPASS_ALIAS).create(
        organization=org, invoice=invoice, student_profile=invoice.student_profile, amount="100000.00"
    )
    invoice.refresh_from_db(using=BYPASS_ALIAS)
    _make_gateway_account(org, provider="payme")

    with pytest.raises(ValidationError):
        _checkout(invoice, "payme")


def test_checkout_rejected_when_no_active_gateway_account():
    org = _make_org()
    invoice = _make_invoice(org)

    with pytest.raises(ValidationError):
        _checkout(invoice, "payme")


def test_checkout_rejected_when_gateway_account_inactive():
    org = _make_org()
    invoice = _make_invoice(org)
    _make_gateway_account(org, provider="payme", is_active=False)

    with pytest.raises(ValidationError):
        _checkout(invoice, "payme")


def test_checkout_rejects_a_non_http_return_url():
    org = _make_org()
    invoice = _make_invoice(org)
    _make_gateway_account(org, provider="payme")

    with pytest.raises(ValidationError):
        _checkout(invoice, "payme", return_url="javascript:alert(1)")


def test_payme_checkout_url_escapes_semicolon_in_return_url():
    """A raw ";" in return_url would otherwise smuggle an extra
    "key=value" pair into Payme's ";"-delimited param string (e.g. a bogus
    "a=" overriding the amount) — it must come out percent-encoded."""
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    _make_gateway_account(org, provider="payme")

    _txn, url = _checkout(invoice, "payme", return_url="https://example.com/return;a=1")

    decoded = base64.b64decode(url.rsplit("/", 1)[-1]).decode()
    assert "return;a=1" not in decoded  # raw, unescaped ";" would smuggle in a bogus extra "a=" field
    assert "return%3Ba%3D1" in decoded  # ";" and "=" inside the return_url value must come out percent-encoded


def test_click_checkout_url_encodes_special_characters_in_return_url():
    """Uses urlencode() now, not manual string-joining — a "&"/"=" in
    return_url must not be able to inject a new query param."""
    org = _make_org()
    invoice = _make_invoice(org, total_amount="100000.00")
    _make_gateway_account(org, provider="click")

    _txn, url = _checkout(invoice, "click", return_url="https://example.com/return?x=1&evil=2")

    assert "&evil=2" not in url
    assert "return_url=https%3A%2F%2Fexample.com" in url


def test_merchant_trans_id_is_unique_idempotency_anchor():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="300000.00")
    _make_gateway_account(org, provider="payme")

    txn1, _ = _checkout(invoice, "payme")
    txn2, _ = _checkout(invoice, "payme")

    assert txn1.merchant_trans_id != txn2.merchant_trans_id
    assert GatewayTransaction.objects.using(BYPASS_ALIAS).filter(invoice=invoice).count() == 2
