import django_filters

from billing.models import SubscriptionPlan


class SubscriptionPlanFilter(django_filters.FilterSet):
    class Meta:
        model = SubscriptionPlan
        fields = ["is_active", "billing_cycle"]
