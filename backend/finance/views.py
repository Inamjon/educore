from decimal import Decimal

from django.db.models import Sum
from rest_framework import viewsets

from common.audit import audited
from common.permissions import HasModulePermission
from finance.filters import InvoiceFilter, PaymentFilter
from finance.models import Invoice, Payment
from finance.serializers import InvoiceSerializer, PaymentSerializer
from foundation.views import SoftDeleteDestroyMixin

FINANCE_PERMISSION_MAP = {
    "list": ("finance", "view"),
    "retrieve": ("finance", "view"),
    "create": ("finance", "create"),
    "update": ("finance", "update"),
    "partial_update": ("finance", "update"),
    "destroy": ("finance", "delete"),
}


def _recompute_invoice_status(invoice: Invoice) -> None:
    """Mirrors the DDL's payment trigger, in Python — same call already made
    for GroupMember's capacity check and Attendance's ownership check living
    in application code rather than a SQL trigger.
    """

    paid = invoice.payments.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    status = "paid" if paid >= invoice.total_amount else "partially_paid" if paid > 0 else "pending"
    if status != invoice.status:
        invoice.status = status
        invoice.save(update_fields=["status"])


class InvoiceViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related("student_profile__user", "group").order_by("-created_at")
    serializer_class = InvoiceSerializer
    permission_classes = [HasModulePermission]
    filterset_class = InvoiceFilter
    search_fields = ["invoice_number"]
    entity_type = "invoice"
    permission_map = FINANCE_PERMISSION_MAP

    @audited(action="create", entity_type="invoice")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="invoice")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class PaymentViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all().select_related("student_profile__user", "invoice").order_by("-created_at")
    serializer_class = PaymentSerializer
    permission_classes = [HasModulePermission]
    filterset_class = PaymentFilter
    entity_type = "payment"
    permission_map = FINANCE_PERMISSION_MAP

    def perform_create(self, serializer):
        payment = serializer.save()
        _recompute_invoice_status(payment.invoice)

    # CLAUDE.md mandates payment events specifically in the audit trail
    # (common/audit.py's docstring: "auth, payment, role-change, deletion").
    @audited(action="create", entity_type="payment")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="payment")
    def destroy(self, request, *args, **kwargs):
        # SoftDeleteDestroyMixin.destroy() soft-deletes directly (never
        # calls perform_destroy()), so the invoice's status is recomputed
        # here rather than in a perform_destroy() override that would
        # never run.
        instance = self.get_object()
        invoice = instance.invoice
        response = super().destroy(request, *args, **kwargs)
        _recompute_invoice_status(invoice)
        return response
