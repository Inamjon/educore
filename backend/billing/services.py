from decimal import Decimal

from django.db.models import Sum

from billing.models import PlatformInvoice


def platform_invoice_paid_amount(invoice: PlatformInvoice) -> Decimal:
    return invoice.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0")


def platform_invoice_balance(invoice: PlatformInvoice) -> Decimal:
    return invoice.amount - platform_invoice_paid_amount(invoice)


def recompute_platform_invoice_status(invoice: PlatformInvoice) -> None:
    """Same shape as `finance.services.recompute_invoice_status` — kept as a
    separate function rather than a shared generic helper since the two
    models (PlatformInvoice.amount vs. Invoice.total_amount) don't share a
    common base class to introspect the field name from.
    """
    paid = platform_invoice_paid_amount(invoice)
    status = "paid" if paid >= invoice.amount else "partially_paid" if paid > 0 else "pending"
    if status != invoice.status:
        invoice.status = status
        invoice.save(update_fields=["status"])
