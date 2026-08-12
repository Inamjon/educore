from django.db import migrations


def seed_permissions_and_backfill_roles(apps, schema_editor):
    """Same pattern as payment_gateways/migrations/0004_seed_permissions.py —
    seeds the (now teacher_salary-inclusive) Permission catalog and re-runs
    provision_default_roles() for every existing org so their
    already-provisioned center_admin/teacher roles pick up the new grants.

    This also closes a real authorization gap, not just adds a new module:
    TeacherSalaryViewSet used to reuse the `teachers` permission_map, so any
    teacher (module-wide `teachers:view`/`teachers:update`) could list every
    other teacher's salary and PATCH any teacher's salary row, including
    their own. See foundation/permissions_catalog.py's "teacher_salary"
    docstring note. Idempotent throughout, safe to re-run.
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
    Permission.objects.filter(module="teacher_salary").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("teacher", "0005_grant_teacher_self_update"),
        ("foundation", "0011_seed_platform_settings_permission"),
    ]

    operations = [
        migrations.RunPython(seed_permissions_and_backfill_roles, reverse_code=unseed_permissions),
    ]
