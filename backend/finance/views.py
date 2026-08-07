from rest_framework import viewsets

from common.audit import audited
from common.permissions import HasModulePermission
from finance.filters import InvoiceFilter, PaymentFilter
from finance.models import Invoice, Payment
from finance.serializers import InvoiceSerializer, PaymentSerializer
from finance.services import recompute_invoice_status
from foundation.views import SoftDeleteDestroyMixin

FINANCE_PERMISSION_MAP = {
    "list": ("finance", "view"),
    "retrieve": ("finance", "view"),
    "create": ("finance", "create"),
    "update": ("finance", "update"),
    "partial_update": ("finance", "update"),
    "destroy": ("finance", "delete"),
}


class InvoiceViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [HasModulePermission]
    filterset_class = InvoiceFilter
    search_fields = ["invoice_number"]
    entity_type = "invoice"
    permission_map = FINANCE_PERMISSION_MAP

    def get_queryset(self):
        """`finance:view` is object-scoped for a student caller — see the
        comment on `DEFAULT_ROLE_PERMISSIONS["student"]`'s grant in
        foundation/permissions_catalog.py. Same pattern as
        homework.views.SubmissionViewSet.get_queryset(). center_admin (the
        only other role holding any finance permission) is unrestricted.
        """
        qs = Invoice.objects.all().select_related("student_profile__user", "group").order_by("-created_at")
        student_profile = getattr(self.request.user, "student_profile", None)
        if student_profile is not None:
            return qs.filter(student_profile=student_profile)
        return qs

    @audited(action="create", entity_type="invoice")
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @audited(action="delete", entity_type="invoice")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class PaymentViewSet(SoftDeleteDestroyMixin, viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [HasModulePermission]
    filterset_class = PaymentFilter
    entity_type = "payment"
    permission_map = FINANCE_PERMISSION_MAP

    def get_queryset(self):
        """Same object-scoping as InvoiceViewSet.get_queryset() — a student
        can list/retrieve their own payment history (`finance:view`) but
        never create/update/delete one directly (`finance:create/update/
        delete` stay center_admin-only; a student's only path to a new
        Payment row is CheckoutInitiateView -> a Payme/Click webhook).
        """
        qs = Payment.objects.all().select_related("student_profile__user", "invoice").order_by("-created_at")
        student_profile = getattr(self.request.user, "student_profile", None)
        if student_profile is not None:
            return qs.filter(student_profile=student_profile)
        return qs

    def perform_create(self, serializer):
        payment = serializer.save()
        recompute_invoice_status(payment.invoice)

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
        recompute_invoice_status(invoice)
        return response
