from django.db import migrations


def seed_permissions(apps, schema_editor):
    """Same pattern as 0009_seed_audit_logs_permission.py — re-seeds the
    whole (now platform_settings-inclusive) Permission catalog from the
    single canonical PERMISSIONS_CATALOG list. No provision_default_roles()
    backfill: `platform_settings` isn't in any org role's
    DEFAULT_ROLE_PERMISSIONS entry — only super_admin, which bypasses the
    per-module grant check entirely, is ever meant to manage these panels.
    """

    from foundation.permissions_catalog import PERMISSIONS_CATALOG

    Permission = apps.get_model("foundation", "Permission")
    for module, action, description in PERMISSIONS_CATALOG:
        Permission.objects.get_or_create(module=module, action=action, defaults={"description": description})


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("foundation", "Permission")
    Permission.objects.filter(module="platform_settings").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("foundation", "0010_organization_subscription_plan_fk"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, reverse_code=unseed_permissions),
    ]
