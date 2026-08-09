from rest_framework.routers import DefaultRouter

from billing.views import PlatformInvoiceViewSet, PlatformPaymentViewSet, SubscriptionPlanViewSet

router = DefaultRouter()
router.register("billing/platform-payments", PlatformPaymentViewSet, basename="platform-payment")
router.register("billing/platform-invoices", PlatformInvoiceViewSet, basename="platform-invoice")
router.register("billing/subscription-plans", SubscriptionPlanViewSet, basename="subscription-plan")

urlpatterns = router.urls
