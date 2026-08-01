from __future__ import annotations


def primary_role_slug(user, *, using: str | None = None) -> str | None:
    """Which of a user's roles determines their portal. A system-level role
    (organization IS NULL, e.g. super_admin) wins over an org-scoped one —
    same priority already used by foundation.is_platform_user() (SQL, see
    migrations/0004_rls.py) and common/permissions.py::user_has_permission
    (Python) for the same "system role implies full access" rule.
    """

    from foundation.models import UserRole

    qs = UserRole.objects.filter(user=user, role__is_active=True).select_related("role")
    if using:
        qs = qs.using(using)

    system_role = next((ur.role for ur in qs if ur.role.organization_id is None), None)
    if system_role:
        return system_role.slug

    org_role = next(iter(qs), None)
    return org_role.role.slug if org_role else None
