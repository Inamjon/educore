from rest_framework.routers import DefaultRouter

from student.views import EmergencyContactViewSet, StudentDocumentViewSet, StudentParentViewSet, StudentProfileViewSet

router = DefaultRouter()
# Sub-resources MUST be registered before "students" itself: DRF's router
# generates a detail route like `students/(?P<pk>[^/.]+)/` for
# StudentProfileViewSet, and Django resolves urlpatterns in registration
# order — if "students" comes first, a request to e.g. "students/parents/"
# matches that wildcard pk pattern (pk="parents") before ever reaching
# StudentParentViewSet's own "students/parents/" routes, breaking every
# sub-resource endpoint (404/405 instead of the real view).
router.register("students/parents", StudentParentViewSet, basename="student-parent")
router.register("students/emergency-contacts", EmergencyContactViewSet, basename="emergency-contact")
router.register("students/documents", StudentDocumentViewSet, basename="student-document")
router.register("students", StudentProfileViewSet, basename="student-profile")

urlpatterns = router.urls
