from django.urls import path
from rest_framework.routers import DefaultRouter

from foundation.views import (
    AuditLogViewSet,
    BranchViewSet,
    OrganizationViewSet,
    PermissionViewSet,
    PlatformBrandingView,
    PlatformSettingsView,
    RoleViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register("organizations", OrganizationViewSet, basename="organization")
router.register("branches", BranchViewSet, basename="branch")
router.register("users", UserViewSet, basename="user")
router.register("roles", RoleViewSet, basename="role")
router.register("permissions", PermissionViewSet, basename="permission")
router.register("audit-logs", AuditLogViewSet, basename="audit-log")

urlpatterns = router.urls + [
    path("settings/platform/", PlatformSettingsView.as_view(), name="platform-settings"),
    path("settings/platform/branding/", PlatformBrandingView.as_view(), name="platform-branding"),
]
