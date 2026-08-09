from __future__ import annotations

# Platform-wide config, stored as one row per panel in the generic
# foundation.Setting table (scope="platform", organization/branch/user all
# NULL — a singleton per key) rather than a dedicated model: only two
# panels (General, Security) are real this phase — Theme/Languages/Email/
# SMS/Backup/API-Keys stay frontend-mock (see the plan doc) — and a flat
# JSON blob per panel matches the Super-Admin Settings page's own form
# shape without inventing a schema for settings that don't persist yet.
DEFAULT_GENERAL_SETTINGS: dict = {
    "platformName": "EduCore",
    "tagline": "The All-in-One LMS Platform",
    "supportEmail": "support@educore.com",
    "logoUrl": None,
    "faviconUrl": None,
}

# twoFactor/ipAllowlist/sessionTimeoutMinutes are stored here but NOT yet
# enforced anywhere (2FA challenge flow, an IP-blocking middleware, and a
# per-request-configurable JWT lifetime are each their own future project —
# see the plan doc's explicit call on this). maxLoginAttempts *is* enforced,
# by auth_custom.views.LoginView; passwordPolicy *is* enforced, by
# foundation.password_policy.validate_password_policy — both are cheap,
# self-contained checks against data this app already writes on every
# request (LoginAttempt) or already validates (a new password).
DEFAULT_SECURITY_SETTINGS: dict = {
    "twoFactor": False,
    "sessionTimeoutMinutes": 60,
    "ipAllowlist": False,
    "maxLoginAttempts": 5,
    "passwordPolicy": "basic",
}

PLATFORM_SETTINGS_DEFAULTS: dict[str, dict] = {
    "general": DEFAULT_GENERAL_SETTINGS,
    "security": DEFAULT_SECURITY_SETTINGS,
}


def get_platform_setting(key: str, *, using: str | None = None) -> dict:
    """Merges whatever's actually stored under PLATFORM_SETTINGS_DEFAULTS[key]
    so a freshly-migrated platform (no row yet) still returns a complete,
    sane shape, and adding a new field to the defaults later doesn't need a
    data migration for installs that already have a row.
    """
    from foundation.models import Setting

    qs = Setting.objects.filter(
        scope="platform", organization__isnull=True, branch__isnull=True, user__isnull=True, key=key
    )
    if using:
        qs = qs.using(using)
    row = qs.first()
    defaults = PLATFORM_SETTINGS_DEFAULTS.get(key, {})
    return {**defaults, **(row.value if row else {})}


def set_platform_setting(key: str, value: dict):
    from foundation.models import Setting

    setting, _created = Setting.objects.update_or_create(
        scope="platform", organization=None, branch=None, user=None, key=key,
        defaults={"value": value},
    )
    return setting


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
