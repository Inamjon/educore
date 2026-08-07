"""RBAC permission checks: foundation.User -> user_roles -> roles ->
role_permissions -> permissions (module, action). See foundation/models for
the tables this reads.
"""

from __future__ import annotations

from rest_framework.permissions import BasePermission


def is_platform_user(user) -> bool:
    """Python-side counterpart to the `foundation.is_platform_user()` SQL
    function RLS policies use (see migrations/0004_rls.py) — same "holds a
    system-level role (organization IS NULL)" check, for view code that
    needs to branch on it directly rather than only gate a single (module,
    action) pair. Currently just `OrganizationViewSet.get_queryset()` (see
    foundation/views.py): Organization itself has no tenant/RLS scoping —
    it IS the tenant root — so without an explicit check here, a
    center_admin's own `organizations:view` grant (needed for their own
    org's Settings page) would otherwise return every organization on the
    platform, not just theirs.
    """
    if user is None or not getattr(user, "is_authenticated", False):
        return False

    from foundation.models import UserRole

    return UserRole.objects.filter(user=user, role__is_active=True, role__organization__isnull=True).exists()


def user_has_permission(user, module: str, action: str) -> bool:
    if user is None or not getattr(user, "is_authenticated", False):
        return False

    from foundation.models import UserRole

    user_roles = UserRole.objects.filter(user=user, role__is_active=True)

    # A system-level role (organization IS NULL, e.g. super_admin) implies
    # full access rather than requiring every individual (module, action)
    # permission to be seeded and linked — matches the same bypass already
    # granted at the RLS layer (foundation.is_platform_user()) for row
    # visibility. Org-scoped roles (center_admin, teacher, ...) still go
    # through the granular check below.
    if user_roles.filter(role__organization__isnull=True).exists():
        return True

    return user_roles.filter(
        role__role_permissions__permission__module=module,
        role__role_permissions__permission__action=action,
    ).exists()


class HasModulePermission(BasePermission):
    """Views declare `permission_map = {"list": ("organizations", "view"), ...}`
    (keyed by DRF action name) or a single `required_permission = (module,
    action)` fallback for all actions.
    """

    def has_permission(self, request, view):
        permission_map = getattr(view, "permission_map", None)
        action = getattr(view, "action", None)

        if permission_map is not None and action in permission_map:
            module, perm_action = permission_map[action]
        else:
            required = getattr(view, "required_permission", None)
            if required is None:
                return True  # view didn't opt in to RBAC gating
            module, perm_action = required

        return user_has_permission(request.user, module, perm_action)
