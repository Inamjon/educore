from rest_framework.routers import DefaultRouter

from schedule.views import LessonViewSet

router = DefaultRouter()
router.register("schedule/lessons", LessonViewSet, basename="lesson")

urlpatterns = router.urls
