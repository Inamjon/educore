from rest_framework.routers import DefaultRouter

from teacher.views import (
    TeacherAvailabilityViewSet,
    TeacherDocumentViewSet,
    TeacherProfileViewSet,
    TeacherSalaryViewSet,
    TeacherSpecializationViewSet,
)

router = DefaultRouter()
router.register("teachers", TeacherProfileViewSet, basename="teacher-profile")
router.register("teachers/salaries", TeacherSalaryViewSet, basename="teacher-salary")
router.register("teachers/availability", TeacherAvailabilityViewSet, basename="teacher-availability")
router.register("teachers/specializations", TeacherSpecializationViewSet, basename="teacher-specialization")
router.register("teachers/documents", TeacherDocumentViewSet, basename="teacher-document")

urlpatterns = router.urls
