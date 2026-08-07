import pytest
from django.db import IntegrityError

from finance.models import Invoice, Payment
from finance.numbering import generate_invoice_number
from finance.views import _recompute_invoice_status
from foundation.models import Organization, User
from student.models import StudentProfile

pytestmark = pytest.mark.django_db


def _make_org(**kwargs):
    kwargs.setdefault("name", "Test Academy")
    kwargs.setdefault("slug", f"test-academy-{Organization.objects.count()}")
    kwargs.setdefault("email", "contact@test-academy.example")
    return Organization.objects.create(**kwargs)


def _make_student(org, **kwargs):
    user = User.objects.create_user(
        organization=org, first_name="Sam", last_name="Student", password="pw123456",
        phone=f"+99891{StudentProfile.objects.count():07d}",
    )
    kwargs.setdefault("student_code", f"STU-{StudentProfile.objects.count() + 1}")
    return StudentProfile.objects.create(organization=org, user=user, **kwargs)


def _make_invoice(org, **kwargs):
    kwargs.setdefault("student_profile", _make_student(org))
    kwargs.setdefault("invoice_number", generate_invoice_number(Invoice, org))
    kwargs.setdefault("total_amount", "1000000.00")
    kwargs.setdefault("due_date", "2026-09-30")
    invoice = Invoice.objects.create(organization=org, **kwargs)
    invoice.refresh_from_db()
    return invoice


def test_invoice_number_is_sequential_per_org_per_year():
    org = _make_org()
    first = generate_invoice_number(Invoice, org)
    _make_invoice(org, invoice_number=first)
    second = generate_invoice_number(Invoice, org)

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

    Payment.objects.create(
        organization=org, invoice=invoice, student_profile=invoice.student_profile, amount="400000.00",
    )
    _recompute_invoice_status(invoice)
    invoice.refresh_from_db()
    assert invoice.status == "partially_paid"

    Payment.objects.create(
        organization=org, invoice=invoice, student_profile=invoice.student_profile, amount="600000.00",
    )
    _recompute_invoice_status(invoice)
    invoice.refresh_from_db()
    assert invoice.status == "paid"


def test_payment_amount_must_be_positive():
    org = _make_org()
    invoice = _make_invoice(org)

    with pytest.raises(IntegrityError):
        Payment.objects.create(organization=org, invoice=invoice, student_profile=invoice.student_profile, amount="0.00")


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    invoice = _make_invoice(org)
    invoice_id = invoice.id

    invoice.delete()

    assert not Invoice.objects.filter(id=invoice_id).exists()
    assert Invoice.all_objects.filter(id=invoice_id).exists()
    assert Invoice.all_objects.get(id=invoice_id).deleted_at is not None
