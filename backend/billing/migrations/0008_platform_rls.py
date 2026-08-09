from django.db import migrations

# (table, org_column, force_rls, nullable_org) — same shape as every other
# app's RLS migration this session (see finance/migrations/0003_rls.py).
# SubscriptionPlan is deliberately absent — it has no organization column
# and isn't tenant data (see its model docstring).
RLS_TABLES = [
    ("platform_invoices", "organization_id", True, False),
    ("platform_payments", "organization_id", True, False),
]


def _policy_sql(table: str, org_column: str, nullable_org: bool) -> str:
    own_row = f"{org_column} = current_setting('app.current_org_id', true)::uuid"
    if nullable_org:
        own_row = f"({own_row} OR {org_column} IS NULL)"
    return f"""
    CREATE POLICY tenant_isolation_{table} ON billing.{table}
        USING ({own_row} OR foundation.is_platform_user());
    """


CREATE_RLS = "\n".join(
    f"""
    ALTER TABLE billing.{table} ENABLE ROW LEVEL SECURITY;
    {"ALTER TABLE billing." + table + " FORCE ROW LEVEL SECURITY;" if force else ""}
    {_policy_sql(table, org_column, nullable_org)}
    """
    for table, org_column, force, nullable_org in RLS_TABLES
)

DROP_RLS = "\n".join(
    f"""
    DROP POLICY IF EXISTS tenant_isolation_{table} ON billing.{table};
    ALTER TABLE billing.{table} NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE billing.{table} DISABLE ROW LEVEL SECURITY;
    """
    for table, _org_column, _force, _nullable_org in RLS_TABLES
)


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0007_platform_triggers"),
        ("foundation", "0004_rls"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_RLS, reverse_sql=DROP_RLS),
    ]
