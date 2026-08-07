from rest_framework.routers import DefaultRouter

from groups.views import GroupMemberViewSet, GroupViewSet

router = DefaultRouter()
# Sub-resources MUST be registered before "groups" itself — see the matching
# comment in student/urls.py for why (a router detail route's wildcard pk
# pattern otherwise shadows every "groups/<sub-resource>/" URL).
router.register("groups/members", GroupMemberViewSet, basename="group-member")
router.register("groups", GroupViewSet, basename="group")

urlpatterns = router.urls
