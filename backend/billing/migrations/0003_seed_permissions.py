from django.db import migrations


def seed_permissions(apps, schema_editor):
    """Same pattern as notifications/migrations/0004_seed_permissions.py —
    re-seeds the whole (now billing-inclusive) Permission catalog from the
    single canonical `PERMISSIONS_CATALOG` list, idempotent via
    get_or_create. Deliberately NOT followed by a
    `provision_default_roles()` backfill loop like every other module's
    seed migration: `billing` isn't in any org role's
    `DEFAULT_ROLE_PERMISSIONS` entry (see permissions_catalog.py's docstring
    on it) — only super_admin, a system-level role that bypasses the
    per-module grant check entirely, is ever meant to manage this catalog.
    """

    from foundation.permissions_catalog import PERMISSIONS_CATALOG

    Permission = apps.get_model("foundation", "Permission")
    for module, action, description in PERMISSIONS_CATALOG:
        Permission.objects.get_or_create(module=module, action=action, defaults={"description": description})


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("foundation", "Permission")
    Permission.objects.filter(module="billing").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0002_triggers"),
        ("foundation", "0009_seed_audit_logs_permission"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, reverse_code=unseed_permissions),
    ]
