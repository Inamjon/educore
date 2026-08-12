from django.db import migrations, transaction


def backfill_student_finance_view(apps, schema_editor):
    """`finance:view`/`payment_gateways:view` were just added to
    DEFAULT_ROLE_PERMISSIONS["student"] (see foundation/permissions_catalog.py)
    for the Student portal's own "Pay" flow — object-scoped by
    finance.views.InvoiceViewSet/PaymentViewSet.get_queryset(), not a
    module-wide grant. Both permissions already exist in the catalog (no
    new Permission rows here, unlike finance/migrations/0004_seed_permissions.py
    or payment_gateways/migrations/0004_seed_permissions.py) — this only
    re-runs provision_default_roles() so every existing org's
    already-provisioned student Role picks up the two new RolePermission
    links. Idempotent (get_or_create throughout), safe to re-run.
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
    """Not worth unwinding — a student keeping read access to their own
    invoice after a rollback isn't a meaningful regression, and the
    RolePermission rows are still exactly what the (unrolled-back) catalog
    describes."""


class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0005_add_gateway_payment_methods"),
        ("payment_gateways", "0004_seed_permissions"),
    ]

    operations = [
        migrations.RunPython(backfill_student_finance_view, reverse_code=noop_reverse),
    ]
