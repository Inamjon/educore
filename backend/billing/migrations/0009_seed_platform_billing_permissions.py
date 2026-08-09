from django.db import migrations


def seed_permissions(apps, schema_editor):
    """Same pattern as billing/migrations/0003_seed_permissions.py — re-seeds
    the whole (now platform_billing-inclusive) Permission catalog from the
    single canonical PERMISSIONS_CATALOG list. No provision_default_roles()
    backfill here either, same reasoning: `platform_billing` isn't in any
    org role's DEFAULT_ROLE_PERMISSIONS entry — only super_admin, which
    bypasses the per-module grant check entirely, is ever meant to manage
    platform invoices/payments.
    """

    from foundation.permissions_catalog import PERMISSIONS_CATALOG

    Permission = apps.get_model("foundation", "Permission")
    for module, action, description in PERMISSIONS_CATALOG:
        Permission.objects.get_or_create(module=module, action=action, defaults={"description": description})


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("foundation", "Permission")
    Permission.objects.filter(module="platform_billing").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0008_platform_rls"),
        ("foundation", "0009_seed_audit_logs_permission"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, reverse_code=unseed_permissions),
    ]
