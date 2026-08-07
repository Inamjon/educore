from django.db import migrations

RLS_TABLES = [
    ("gateway_accounts", "organization_id", True, False),
    ("gateway_transactions", "organization_id", True, False),
]


def _policy_sql(table: str, org_column: str, nullable_org: bool) -> str:
    own_row = f"{org_column} = current_setting('app.current_org_id', true)::uuid"
    if nullable_org:
        own_row = f"({own_row} OR {org_column} IS NULL)"
    return f"""
    CREATE POLICY tenant_isolation_{table} ON payment_gateways.{table}
        USING ({own_row} OR foundation.is_platform_user());
    """


CREATE_RLS = "\n".join(
    f"""
    ALTER TABLE payment_gateways.{table} ENABLE ROW LEVEL SECURITY;
    {"ALTER TABLE payment_gateways." + table + " FORCE ROW LEVEL SECURITY;" if force else ""}
    {_policy_sql(table, org_column, nullable_org)}
    """
    for table, org_column, force, nullable_org in RLS_TABLES
)

DROP_RLS = "\n".join(
    f"""
    DROP POLICY IF EXISTS tenant_isolation_{table} ON payment_gateways.{table};
    ALTER TABLE payment_gateways.{table} NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE payment_gateways.{table} DISABLE ROW LEVEL SECURITY;
    """
    for table, _org_column, _force, _nullable_org in RLS_TABLES
)


class Migration(migrations.Migration):
    dependencies = [
        ("payment_gateways", "0002_triggers"),
        ("foundation", "0004_rls"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_RLS, reverse_sql=DROP_RLS),
    ]
