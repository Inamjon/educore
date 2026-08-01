from rest_framework.routers import DefaultRouter

from teacher.views import (
    TeacherAvailabilityViewSet,
    TeacherDocumentViewSet,
    TeacherProfileViewSet,
    TeacherSalaryViewSet,
    TeacherSpecializationViewSet,
)

router = DefaultRouter()
# Sub-resources MUST be registered before "teachers" itself — see the
# matching comment in student/urls.py for why (a router detail route's
# wildcard pk pattern otherwise shadows every "teachers/<sub-resource>/" URL).
router.register("teachers/salaries", TeacherSalaryViewSet, basename="teacher-salary")
router.register("teachers/availability", TeacherAvailabilityViewSet, basename="teacher-availability")
router.register("teachers/specializations", TeacherSpecializationViewSet, basename="teacher-specialization")
router.register("teachers/documents", TeacherDocumentViewSet, basename="teacher-document")
router.register("teachers", TeacherProfileViewSet, basename="teacher-profile")

urlpatterns = router.urls
