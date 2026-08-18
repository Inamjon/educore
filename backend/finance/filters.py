import django_filters

from finance.models import Invoice, Payment


class InvoiceFilter(django_filters.FilterSet):
    # Same shape as exams.filters.ExamFilter/attendance.filters.
    # AttendanceFilter's date_from/date_to — lets the Admin Finance page
    # bound its default query to a recent window instead of paging through
    # every invoice the org has ever issued, which grows without limit.
    date_from = django_filters.DateFilter(field_name="issued_date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="issued_date", lookup_expr="lte")

    class Meta:
        model = Invoice
        fields = ["organization", "student_profile", "group", "status", "date_from", "date_to"]


class PaymentFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="payment_date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="payment_date", lookup_expr="lte")

    class Meta:
        model = Payment
        fields = ["organization", "invoice", "student_profile", "date_from", "date_to"]
