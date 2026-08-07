from rest_framework.routers import DefaultRouter

from homework.views import AssignmentViewSet, SubmissionViewSet

router = DefaultRouter()
router.register("homework/submissions", SubmissionViewSet, basename="submission")
router.register("homework/assignments", AssignmentViewSet, basename="assignment")

urlpatterns = router.urls
