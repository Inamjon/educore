from django.db import migrations, transaction


def seed_permissions_and_backfill_roles(apps, schema_editor):
    """Same pattern as attendance/migrations/0004_seed_permissions.py — seeds
    the (now finance-inclusive) Permission catalog and re-runs
    provision_default_roles() for every existing org so their
    already-provisioned center_admin role picks up the new finance grants.
    Idempotent throughout, safe to re-run.

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

    THREE MORE BUGS FIXED HERE (2026-08-14): the same freshly-created-DB-only
    failure this loop's own docstring above already warns about, this time
    from a fresh-migrate ordering issue rather than a missing RLS context.
    See attendance/migrations/0004_seed_permissions.py's docstring for the
    full investigation — short version: (1) '.all()' pulled in a column
    later renamed by foundation/migrations/0010, so switched to
    '.only("id")'; (2) provision_default_roles() needs a *live*
    Organization instance, not the historical one from apps.get_model(),
    so it's now handed 'LiveOrganization(id=org.id)' instead of 'org';
    (3) the auth_bypass_rls connection can still be pointed at the real dev
    database when this runs, since its TEST.MIRROR redirect to the test
    database isn't guaranteed to have applied yet -- force-synced to
    connections['default']'s current NAME right before use instead of
    trusting that timing.
    """

    from foundation.permissions_catalog import PERMISSIONS_CATALOG
    from common.context import apply_org_context
    from foundation.models import Organization as LiveOrganization
    from foundation.services import provision_default_roles

    Permission = apps.get_model("foundation", "Permission")
    for module, action, description in PERMISSIONS_CATALOG:
        Permission.objects.get_or_create(module=module, action=action, defaults={"description": description})

    from django.db import connections

    connections["auth_bypass_rls"].settings_dict["NAME"] = connections["default"].settings_dict["NAME"]
    connections["auth_bypass_rls"].close()

    Organization = apps.get_model("foundation", "Organization")
    for org in Organization.objects.using("auth_bypass_rls").only("id"):
        with transaction.atomic():
            apply_org_context(str(org.id))
            provision_default_roles(LiveOrganization(id=org.id))


def unseed_permissions(apps, schema_editor):
    Permission = apps.get_model("foundation", "Permission")
    Permission.objects.filter(module="finance").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0003_rls"),
        ("foundation", "0008_remove_user_email"),
    ]

    operations = [
        migrations.RunPython(seed_permissions_and_backfill_roles, reverse_code=unseed_permissions),
    ]
