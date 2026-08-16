from django.db import migrations, transaction


def seed_permissions_and_backfill_roles(apps, schema_editor):
    """Same pattern as attendance/migrations/0004_seed_permissions.py and
    homework/migrations/0004_seed_permissions.py — seeds the (now
    exams-inclusive) Permission catalog and re-runs provision_default_roles()
    for every existing org so their already-provisioned roles pick up the
    new exams grants. Idempotent throughout, safe to re-run.

    Written directly against the already-fixed shape from the start (see
    attendance's 0004 for the full investigation of the three bugs this
    sidesteps): iterate orgs via auth_bypass_rls selecting only `id`, force-
    sync that alias's NAME to whatever `default` is actually migrating right
    before use, and hand provision_default_roles() a *live*
    foundation.models.Organization stub (not the historical apps.get_model()
    instance) inside real org context.
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
    Permission.objects.filter(module="exams").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("exams", "0003_rls"),
        ("foundation", "0008_remove_user_email"),
    ]

    operations = [
        migrations.RunPython(seed_permissions_and_backfill_roles, reverse_code=unseed_permissions),
    ]
