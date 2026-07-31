from django.db import migrations

# (table, nullable_org) — all reference foundation.is_platform_user() (cross-
# schema function calls are fine in Postgres) for the same super-admin
# cross-org bypass as foundation's policies. Unlike foundation.roles/
# user_roles, none of these tables are read BY is_platform_user() itself, so
# there's no circularity risk — every table here gets FORCE ROW LEVEL
# SECURITY. `login_attempts` gets a policy at all (the original docs enabled
# RLS on it but never wrote one — see foundation/migrations/0004_rls.py for
# the same class of gap).
RLS_TABLES = [
    ("login_attempts", True),
    ("refresh_tokens", False),
    ("sessions", False),
    ("password_resets", False),
    ("email_verifications", False),
    ("phone_verifications", False),
]


def _policy_sql(table: str, nullable_org: bool) -> str:
    own_row = "organization_id = current_setting('app.current_org_id', true)::uuid"
    if nullable_org:
        own_row = f"({own_row} OR organization_id IS NULL)"
    return f"""
    CREATE POLICY tenant_isolation_{table} ON auth.{table}
        USING ({own_row} OR foundation.is_platform_user());
    """


CREATE_RLS = "\n".join(
    f"""
    ALTER TABLE auth.{table} ENABLE ROW LEVEL SECURITY;
    ALTER TABLE auth.{table} FORCE ROW LEVEL SECURITY;
    {_policy_sql(table, nullable_org)}
    """
    for table, nullable_org in RLS_TABLES
)

DROP_RLS = "\n".join(
    f"""
    DROP POLICY IF EXISTS tenant_isolation_{table} ON auth.{table};
    ALTER TABLE auth.{table} NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE auth.{table} DISABLE ROW LEVEL SECURITY;
    """
    for table, _nullable_org in RLS_TABLES
)


class Migration(migrations.Migration):
    dependencies = [
        ("auth_custom", "0002_triggers"),
        ("foundation", "0004_rls"),  # foundation.is_platform_user() must already exist
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_RLS, reverse_sql=DROP_RLS),
    ]
