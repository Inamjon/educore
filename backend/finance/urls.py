from rest_framework.routers import DefaultRouter

from finance.views import InvoiceViewSet, PaymentViewSet

router = DefaultRouter()
router.register("finance/payments", PaymentViewSet, basename="payment")
router.register("finance/invoices", InvoiceViewSet, basename="invoice")

urlpatterns = router.urls
