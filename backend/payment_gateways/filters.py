import django_filters

from payment_gateways.models import PaymentGatewayAccount


class PaymentGatewayAccountFilter(django_filters.FilterSet):
    class Meta:
        model = PaymentGatewayAccount
        fields = ["organization", "provider", "is_active"]
