from django.db import migrations


def seed_permissions(apps, schema_editor):
    from foundation.permissions_catalog import PERMISSIONS_CATALOG

    Permission = apps.get_model("foundation", "Permission")
    for module, action, description in PERMISSIONS_CATALOG:
        Permission.objects.get_or_create(module=module, action=action, defaults={"description": description})


def unseed_permissions(apps, schema_editor):
    from foundation.permissions_catalog import PERMISSIONS_CATALOG

    Permission = apps.get_model("foundation", "Permission")
    for module, action, _description in PERMISSIONS_CATALOG:
        Permission.objects.filter(module=module, action=action).delete()


class Migration(migrations.Migration):
    """Seeds the Permission catalog as data (not a one-off management
    command) so it's guaranteed to exist after `migrate`, the same way
    Django's own contenttypes/permissions are — see
    foundation/permissions_catalog.py for the source list and why it
    deliberately diverges from database/15-seed-and-recommendations.sql.
    """

    dependencies = [
        ("foundation", "0006_add_missing_updated_at_triggers"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, reverse_code=unseed_permissions),
    ]
