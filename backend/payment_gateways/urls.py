from django.urls import path
from rest_framework.routers import DefaultRouter

from payment_gateways.views import (
    CheckoutInitiateView,
    ClickWebhookView,
    PaymeWebhookView,
    PaymentGatewayAccountViewSet,
)

router = DefaultRouter()
router.register("payment-gateways/gateway-accounts", PaymentGatewayAccountViewSet, basename="gateway-account")

urlpatterns = router.urls + [
    path("payment-gateways/checkout/", CheckoutInitiateView.as_view(), name="payment-checkout"),
    path(
        "payment-gateways/webhooks/payme/<uuid:gateway_account_id>/",
        PaymeWebhookView.as_view(),
        name="payme-webhook",
    ),
    path(
        "payment-gateways/webhooks/click/<uuid:gateway_account_id>/",
        ClickWebhookView.as_view(),
        name="click-webhook",
    ),
]
