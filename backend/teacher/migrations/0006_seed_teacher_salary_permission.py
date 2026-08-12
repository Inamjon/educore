from django.db import migrations, transaction


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

    BUG FIXED HERE: the org backfill loop originally called
    `Organization.objects.all()` on the RLS-enforced `default` connection
    with no org context ever applied. foundation.organizations' RLS policy
    is `id = current_setting('app.current_org_id', true)::uuid OR
    is_platform_user()` — with no context set, current_setting(...) is NULL
    and is_platform_user() is also false (no app.current_user_id set
    either), so that query silently returned ZERO rows and the loop body
    never ran for a single pre-existing org. The Permission catalog rows
    above still got created (Permission has no RLS — it's a global
    reference table), so `manage.py migrate` reported success even though
    the role backfill for every org that existed before this migration ran
    did nothing at all. (Every earlier seed-permission migration in this
    codebase — payment_gateways/0004, foundation/0009, billing/0009,
    foundation/0011 — shares this same pattern and is presumed to have the
    same bug; not fixed here, flagged separately.)

    Fixed by reading the org list through the auth_bypass_rls alias (which
    has BYPASSRLS, so it actually sees every org regardless of context) and
    applying real org context via common.context.apply_org_context before
    each org's provision_default_roles() call — the same pattern every
    RLS-protected test fixture in this codebase already uses.
    """

    from common.context import apply_org_context
    from foundation.permissions_catalog import PERMISSIONS_CATALOG
    from foundation.services import provision_default_roles

    Permission = apps.get_model("foundation", "Permission")
    for module, action, description in PERMISSIONS_CATALOG:
        Permission.objects.get_or_create(module=module, action=action, defaults={"description": description})

    Organization = apps.get_model("foundation", "Organization")
    for org in Organization.objects.using("auth_bypass_rls").all():
        with transaction.atomic():
            apply_org_context(str(org.id))
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
