from rest_framework.routers import DefaultRouter

from exams.views import ExamResultViewSet, ExamViewSet

router = DefaultRouter()
router.register("exams/results", ExamResultViewSet, basename="exam-result")
router.register("exams", ExamViewSet, basename="exam")

urlpatterns = router.urls
