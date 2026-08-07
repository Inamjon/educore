from django.db import migrations


def backfill_role_grants(apps, schema_editor):
    """teachers:update is not a new Permission row (it's existed since
    teacher/migrations/0001_initial's era) — this migration only backfills
    the new *grant* of it to the "teacher" role (see
    foundation/permissions_catalog.py) onto every already-provisioned org,
    same idempotent provision_default_roles re-run pattern as
    course/migrations/0004_seed_permissions.py.
    """

    from foundation.models import Organization
    from foundation.services import provision_default_roles

    for org in Organization.objects.all():
        provision_default_roles(org)


def noop_reverse(apps, schema_editor):
    # Deliberately not revoking — see course/migrations/0004_seed_permissions.py's
    # matching note on why un-granting isn't a safe reverse operation.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("teacher", "0004_fix_updated_at_trigger_timing"),
        ("foundation", "0008_remove_user_email"),
    ]

    operations = [
        migrations.RunPython(backfill_role_grants, reverse_code=noop_reverse),
    ]
