from django.db import migrations


def seed_permissions_and_backfill_roles(apps, schema_editor):
    """Same pattern as course/migrations/0004_seed_permissions.py — seeds
    the (now attendance-inclusive) Permission catalog and re-runs
    provision_default_roles() for every existing org so their
    already-provisioned center_admin/teacher/student roles pick up the new
    attendance grants. Idempotent throughout, safe to re-run.
    """

    from foundation.permissions_catalog import PERMISSIONS_CATALOG
    from foundation.services import provision_default_roles

    Permission = apps.get_model("foundation", "Permission")
    for module, action, description in PERMISSIONS_CATALOG:
        Permission.objects.get_or_create(module=module, action=action, defaults={"description": description})

    Organization = apps.get_model("foundation", "Organization")
    for org in Organization.objects.all():
        provision_default_roles(org)


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("foundation", "Permission")
    Permission.objects.filter(module="attendance").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("attendance", "0003_rls"),
        ("foundation", "0008_remove_user_email"),
    ]

    operations = [
        migrations.RunPython(seed_permissions_and_backfill_roles, reverse_code=unseed_permissions),
    ]
