"""Model/service-level tests for finance.Invoice/Payment.

Fixture setup goes through the auth_bypass_rls alias (same
chicken-and-egg reasoning as payment_gateways/tests/test_checkout.py's
module docstring: an Organization's own id can't satisfy its RLS policy at
insert time) — `transaction=True` is what makes those BYPASSRLS-connection
writes actually visible to the `default`-connection code under test
(`generate_invoice_number`, `recompute_invoice_status`), since they're
genuinely separate Postgres connections/sessions.
"""

import uuid

import pytest
from django.db import IntegrityError
from django.db import transaction as db_transaction

from common.context import apply_org_context
from finance.models import Invoice, Payment
from finance.numbering import generate_invoice_number
from finance.services import recompute_invoice_status
from foundation.models import Organization, User
from student.models import StudentProfile

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org(**kwargs):
    org_id = uuid.uuid4()
    kwargs.setdefault("name", "Test Academy")
    kwargs.setdefault("slug", f"test-academy-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("email", "contact@test-academy.example")
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(id=org_id, **kwargs)


def _make_student(org, **kwargs):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Sam", last_name="Student", password="pw123456",
        phone=f"+99891{uuid.uuid4().hex[:7]}",
    )
    kwargs.setdefault("student_code", f"STU-{uuid.uuid4().hex[:6]}")
    return StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=user, **kwargs)


def _generate_invoice_number(org):
    # Real application code (finance/numbering.py) — runs on the *default*
    # connection under `select_for_update()`, so it needs a live, matching
    # org context, unlike the BYPASSRLS-backed fixture helpers above.
    with db_transaction.atomic():
        apply_org_context(str(org.id))
        return generate_invoice_number(Invoice, org)


def _make_invoice(org, **kwargs):
    kwargs.setdefault("student_profile", _make_student(org))
    kwargs.setdefault("invoice_number", _generate_invoice_number(org))
    kwargs.setdefault("total_amount", "1000000.00")
    kwargs.setdefault("due_date", "2026-09-30")
    invoice = Invoice.objects.using(BYPASS_ALIAS).create(organization=org, **kwargs)
    invoice.refresh_from_db(using=BYPASS_ALIAS)
    return invoice


def _recompute_invoice_status(invoice):
    with db_transaction.atomic():
        apply_org_context(str(invoice.organization_id))
        recompute_invoice_status(invoice)


def test_invoice_number_is_sequential_per_org_per_year():
    org = _make_org()
    first = _generate_invoice_number(org)
    _make_invoice(org, invoice_number=first)
    second = _generate_invoice_number(org)

    assert first.startswith("INV-")
    assert second != first
    assert int(second.rsplit("-", 1)[-1]) == int(first.rsplit("-", 1)[-1]) + 1


def test_invoice_number_unique_per_organization():
    org = _make_org()
    _make_invoice(org, invoice_number="INV-2026-0001")

    with pytest.raises(IntegrityError):
        _make_invoice(org, invoice_number="INV-2026-0001")


def test_payment_recomputes_invoice_status_to_partially_paid_then_paid():
    org = _make_org()
    invoice = _make_invoice(org, total_amount="1000000.00")
    assert invoice.status == "pending"

    Payment.objects.using(BYPASS_ALIAS).create(
        organization=org, invoice=invoice, student_profile=invoice.student_profile, amount="400000.00",
    )
    _recompute_invoice_status(invoice)
    invoice.refresh_from_db(using=BYPASS_ALIAS)
    assert invoice.status == "partially_paid"

    Payment.objects.using(BYPASS_ALIAS).create(
        organization=org, invoice=invoice, student_profile=invoice.student_profile, amount="600000.00",
    )
    _recompute_invoice_status(invoice)
    invoice.refresh_from_db(using=BYPASS_ALIAS)
    assert invoice.status == "paid"


def test_payment_amount_must_be_positive():
    org = _make_org()
    invoice = _make_invoice(org)

    with pytest.raises(IntegrityError):
        Payment.objects.using(BYPASS_ALIAS).create(
            organization=org, invoice=invoice, student_profile=invoice.student_profile, amount="0.00"
        )


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    invoice = _make_invoice(org)
    invoice_id = invoice.id

    invoice.delete(using=BYPASS_ALIAS)

    assert not Invoice.objects.using(BYPASS_ALIAS).filter(id=invoice_id).exists()
    assert Invoice.all_objects.using(BYPASS_ALIAS).filter(id=invoice_id).exists()
    assert Invoice.all_objects.using(BYPASS_ALIAS).get(id=invoice_id).deleted_at is not None
