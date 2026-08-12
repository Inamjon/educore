import django.db.models.deletion
from django.db import migrations, models


def migrate_string_to_fk(apps, schema_editor):
    """BUG FIXED HERE (2026-08-12): this used to read/write through the
    RLS-enforced `default` connection with no org context applied.
    foundation.organizations' RLS policy requires `app.current_org_id` to
    match the row (or is_platform_user()), so with neither set,
    `Organization.objects.all()` silently returned ZERO rows — no
    pre-existing org's subscription_plan_old value was ever actually read
    or migrated to the new FK, despite `manage.py migrate` reporting
    success. Same root cause as
    teacher/migrations/0006_seed_teacher_salary_permission.py's docstring;
    fixed the same way — read and write through the auth_bypass_rls alias,
    which has BYPASSRLS and needs no per-row context at all.
    """
    Organization = apps.get_model("foundation", "Organization")
    SubscriptionPlan = apps.get_model("billing", "SubscriptionPlan")
    plan_id_by_slug = {
        plan.slug: plan.id for plan in SubscriptionPlan.objects.using("auth_bypass_rls").all()
    }

    for org in Organization.objects.using("auth_bypass_rls").all().iterator():
        plan_id = plan_id_by_slug.get(org.subscription_plan_old)
        if plan_id is not None:
            Organization.objects.using("auth_bypass_rls").filter(pk=org.pk).update(subscription_plan_id=plan_id)


def migrate_fk_to_string(apps, schema_editor):
    """Reverse — only exercised if this migration is ever rolled back.
    Anything with no matching plan (shouldn't happen going forward, but a
    plan could theoretically have been hard-deleted by then) falls back to
    "free" rather than leaving the old CharField NULL, since that column
    doesn't allow null. Same auth_bypass_rls fix as the forward function.
    """
    Organization = apps.get_model("foundation", "Organization")
    SubscriptionPlan = apps.get_model("billing", "SubscriptionPlan")
    slug_by_plan_id = {
        plan.id: plan.slug for plan in SubscriptionPlan.objects.using("auth_bypass_rls").all()
    }

    for org in Organization.objects.using("auth_bypass_rls").all().iterator():
        slug = slug_by_plan_id.get(org.subscription_plan_id, "free")
        Organization.objects.using("auth_bypass_rls").filter(pk=org.pk).update(subscription_plan_old=slug)


class Migration(migrations.Migration):
    """Converts `Organization.subscription_plan` from a fixed 6-value enum
    (CharField) to a FK into the new dynamic `billing.SubscriptionPlan`
    catalog. Multi-step (rename old column out of the way -> add the real FK
    -> data-migrate by slug -> drop the old column) rather than a single
    AlterField, because Postgres can't `ALTER COLUMN TYPE varchar -> uuid`
    with a meaningful `USING` clause on its own — the old -> new mapping is
    a lookup (via billing's seeded plan slugs), not a cast.

    Confirmed by grepping the whole backend before writing this: the string
    value was only ever read/written in organization.py (the field itself),
    serializers.py, filters.py, and create_super_admin.py (a literal
    "enterprise") — nothing branches application logic on it, so this is a
    low-risk data shape change. The new field is nullable specifically so
    this migration touches zero test fixtures across the whole suite — many
    create an Organization without ever setting subscription_plan at all,
    and a NOT NULL column would need a migration-time-constant FK default,
    which a data-seeded row can't provide. See the plan doc for the full
    design discussion: C:\\Users\\qrina\\.claude\\plans\\hazy-orbiting-lantern.md
    """

    dependencies = [
        ("foundation", "0009_seed_audit_logs_permission"),
        ("billing", "0004_seed_plans"),
    ]

    operations = [
        migrations.RenameField(
            model_name="organization", old_name="subscription_plan", new_name="subscription_plan_old",
        ),
        migrations.AddField(
            model_name="organization",
            name="subscription_plan",
            field=models.ForeignKey(
                null=True, blank=True, on_delete=django.db.models.deletion.PROTECT,
                to="billing.subscriptionplan", db_column="subscription_plan_id",
            ),
        ),
        migrations.RunPython(migrate_string_to_fk, reverse_code=migrate_fk_to_string),
        migrations.RemoveField(model_name="organization", name="subscription_plan_old"),
    ]
