import django_filters

from billing.models import PlatformInvoice, PlatformPayment, SubscriptionPlan


class SubscriptionPlanFilter(django_filters.FilterSet):
    class Meta:
        model = SubscriptionPlan
        fields = ["is_active", "billing_cycle"]


class PlatformInvoiceFilter(django_filters.FilterSet):
    class Meta:
        model = PlatformInvoice
        fields = ["organization", "subscription_plan", "status"]


class PlatformPaymentFilter(django_filters.FilterSet):
    class Meta:
        model = PlatformPayment
        fields = ["organization", "platform_invoice"]
