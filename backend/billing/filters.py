import django_filters

from billing.models import PlatformInvoice, PlatformPayment, SubscriptionPlan


class SubscriptionPlanFilter(django_filters.FilterSet):
    class Meta:
        model = SubscriptionPlan
        fields = ["is_active", "billing_cycle"]


class PlatformInvoiceFilter(django_filters.FilterSet):
    # Same shape as foundation.filters.AuditLogFilter's date_from/date_to —
    # lets the Super-Admin Payments page bound its default query to a recent
    # window instead of paging through every invoice ever issued platform-
    # wide, which grows without limit as more centers get billed each cycle.
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = PlatformInvoice
        fields = ["organization", "subscription_plan", "status", "date_from", "date_to"]


class PlatformPaymentFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="payment_date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="payment_date", lookup_expr="lte")

    class Meta:
        model = PlatformPayment
        fields = ["organization", "platform_invoice", "date_from", "date_to"]
