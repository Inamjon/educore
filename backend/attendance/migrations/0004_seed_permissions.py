from django.db import migrations, transaction


def seed_permissions_and_backfill_roles(apps, schema_editor):
    """Same pattern as course/migrations/0004_seed_permissions.py — seeds
    the (now attendance-inclusive) Permission catalog and re-runs
    provision_default_roles() for every existing org so their
    already-provisioned center_admin/teacher/student roles pick up the new
    attendance grants. Idempotent throughout, safe to re-run.

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

    THREE MORE BUGS FIXED HERE (2026-08-14), found while auditing Attendance
    and only reproducible on a truly from-scratch `migrate` (never observed
    on a `--reuse-db` test database, which is why they went unnoticed):

    1. `Organization.objects.using("auth_bypass_rls").all()` selected every
       column of the *historical* (as-of-this-migration) Organization model.
       foundation/migrations/0010_organization_subscription_plan_fk.py later
       renames that model's `subscription_plan` column, and nothing forces
       it to apply before this migration in a fresh, fully-topological
       `migrate` -- so this SELECT could run against a table whose
       `subscription_plan` column no longer exists, raising
       `ProgrammingError`. Fixed by selecting only `id` (`.only("id")`),
       which this loop is the only column it ever needs and which no
       migration ever renames.
    2. `provision_default_roles()` is imported live from foundation.services
       and does `Role.objects.get_or_create(organization=organization, ...)`
       against the *live* Organization model class. Passing it the
       *historical* `org` instance from `apps.get_model(...)` above trips
       Django's cross-model instance check (`ValueError: Cannot query
       "Organization object (...)": Must be "Organization" instance.`) --
       the historical and live classes share a table but aren't the same
       Python class. Fixed by handing it an unsaved *live* Organization
       stub carrying just the id (`LiveOrganization(id=org.id)`) instead of
       the historical instance -- sufficient for every FK use inside
       provision_default_roles(), no query needed to build it.
    3. `auth_bypass_rls` is configured with `"TEST": {"MIRROR": "default"}`
       (config/settings/base.py) so that under `pytest` it targets the
       *same* ephemeral test database as `default`, not a second physical
       one -- but that redirection is applied to the alias by Django's test
       setup at some point during `setup_databases()`, not necessarily
       before *this specific* migration's RunPython executes. Observed
       concretely: this connection still resolved to the real dev
       database's name -- the `**DATABASES["default"]` spread in base.py
       copies that value at *import* time, before config/settings/test.py
       overrides `default`'s own name to the test database -- while
       `default` itself (via `schema_editor`, i.e. whatever `manage.py
       migrate` is actually migrating) was already correctly on the test
       database. Net effect: this loop read real, production-shaped org
       rows through `auth_bypass_rls` while the real INSERT below ran
       against the empty test database via `default` -- a role backfill
       for orgs that don't exist in the database being written to. Fixed by
       force-syncing the alias to whatever `default` is *actually*
       migrating, right before using it -- a no-op in production, where
       both aliases already point at the same database.
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
    Permission.objects.filter(module="attendance").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("attendance", "0003_rls"),
        ("foundation", "0008_remove_user_email"),
    ]

    operations = [
        migrations.RunPython(seed_permissions_and_backfill_roles, reverse_code=unseed_permissions),
    ]
