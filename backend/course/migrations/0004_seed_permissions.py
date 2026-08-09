from django.db import migrations


def seed_permissions_and_backfill_roles(apps, schema_editor):
    """Same idempotent seed as foundation/migrations/0007_seed_permissions.py,
    plus a backfill: existing organizations' center_admin/teacher/student
    roles were provisioned before "courses"/"groups" existed in
    DEFAULT_ROLE_PERMISSIONS, so provision_default_roles() needs re-running
    for every org that already exists — it's get_or_create throughout, so
    re-running it is a no-op for anything already granted and only adds the
    new courses/groups grants.
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
    # Deliberately don't revert the role backfill — un-granting permissions
    # organizations may already be relying on isn't a safe reverse operation.
    Permission = apps.get_model("foundation", "Permission")
    Permission.objects.filter(module__in=["courses", "groups"]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("course", "0003_rls"),
        ("groups", "0003_rls"),
        ("foundation", "0008_remove_user_email"),
    ]

    operations = [
        migrations.RunPython(seed_permissions_and_backfill_roles, reverse_code=unseed_permissions),
    ]
