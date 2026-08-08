from rest_framework.routers import DefaultRouter

from billing.views import SubscriptionPlanViewSet

router = DefaultRouter()
router.register("billing/subscription-plans", SubscriptionPlanViewSet, basename="subscription-plan")

urlpatterns = router.urls
