from __future__ import annotations


def provision_default_roles(organization) -> None:
    """Every organization gets its own center_admin/teacher/student Role
    rows (idempotent) the moment it's created, each pre-linked to a sane
    default permission set — see foundation/permissions_catalog.py for both.
    Called from the post_save signal on Organization (foundation/signals.py)
    so it fires regardless of whether the org was created via the API, a
    management command, or a test — not just one call site to remember.

    Deliberately org-scoped (organization=<this org>), not organization=None
    like super_admin: a null-organization role would satisfy
    foundation.is_platform_user()'s `organization_id IS NULL` check and grant
    every teacher/student cross-organization RLS visibility, which is not
    what these roles are meant to do.
    """

    from foundation.models import Permission, Role, RolePermission
    from foundation.permissions_catalog import DEFAULT_ROLE_NAMES, DEFAULT_ROLE_PERMISSIONS

    for slug, permission_pairs in DEFAULT_ROLE_PERMISSIONS.items():
        role, _created = Role.objects.get_or_create(
            organization=organization,
            slug=slug,
            defaults={"name": DEFAULT_ROLE_NAMES[slug], "is_system": False, "is_active": True},
        )
        for module, action in permission_pairs:
            permission = Permission.objects.filter(module=module, action=action).first()
            if permission is None:
                continue  # catalog/migration out of sync — skip rather than crash org creation
            RolePermission.objects.get_or_create(role=role, permission=permission)


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
