import django_filters

from finance.models import Invoice, Payment


class InvoiceFilter(django_filters.FilterSet):
    class Meta:
        model = Invoice
        fields = ["organization", "student_profile", "group", "status"]


class PaymentFilter(django_filters.FilterSet):
    class Meta:
        model = Payment
        fields = ["organization", "invoice", "student_profile"]
