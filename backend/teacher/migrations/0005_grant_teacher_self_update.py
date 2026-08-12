from django.db import migrations, transaction


def backfill_role_grants(apps, schema_editor):
    """teachers:update is not a new Permission row (it's existed since
    teacher/migrations/0001_initial's era) — this migration only backfills
    the new *grant* of it to the "teacher" role (see
    foundation/permissions_catalog.py) onto every already-provisioned org,
    same idempotent provision_default_roles re-run pattern as
    course/migrations/0004_seed_permissions.py.
    BUG FIXED HERE (2026-08-12): this backfill loop used to call
    `Organization.objects.all()` on the RLS-enforced `default` connection
    with no org context applied -- foundation.organizations' RLS policy
    requires that context to match (or is_platform_user()), so with neither
    set the query silently returned ZERO rows and this loop never actually
    granted anything to a single pre-existing org, despite `manage.py
    migrate` reporting success. See
    teacher/migrations/0006_seed_teacher_salary_permission.py's docstring
    for the full investigation. Fixed the same way here: read orgs through
    auth_bypass_rls (BYPASSRLS, sees everything) and apply real org context
    before each org's provision_default_roles() call.
    """

    from common.context import apply_org_context
    from foundation.services import provision_default_roles

    Organization = apps.get_model("foundation", "Organization")
    for org in Organization.objects.using("auth_bypass_rls").all():
        with transaction.atomic():
            apply_org_context(str(org.id))
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
