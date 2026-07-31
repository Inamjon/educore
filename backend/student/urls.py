from rest_framework.routers import DefaultRouter

from student.views import EmergencyContactViewSet, StudentDocumentViewSet, StudentParentViewSet, StudentProfileViewSet

router = DefaultRouter()
router.register("students", StudentProfileViewSet, basename="student-profile")
router.register("students/parents", StudentParentViewSet, basename="student-parent")
router.register("students/emergency-contacts", EmergencyContactViewSet, basename="emergency-contact")
router.register("students/documents", StudentDocumentViewSet, basename="student-document")

urlpatterns = router.urls
