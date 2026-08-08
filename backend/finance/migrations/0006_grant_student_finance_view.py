from django.db import migrations


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
    """

    from foundation.models import Organization
    from foundation.services import provision_default_roles

    for org in Organization.objects.all():
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
