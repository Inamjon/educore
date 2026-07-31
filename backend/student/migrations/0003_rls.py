from django.db import migrations

# (table, org_column, force_rls, nullable_org) — mirrors foundation/
# migrations/0004_rls.py's pattern exactly. All student.* tables carry a
# NOT NULL organization_id, so nullable_org is False throughout, and none of
# them are read by foundation.is_platform_user() itself, so FORCE is safe
# everywhere (no circularity risk like foundation.roles/user_roles had).
RLS_TABLES = [
    ("student_profiles", "organization_id", True, False),
    ("student_parents", "organization_id", True, False),
    ("emergency_contacts", "organization_id", True, False),
    ("student_documents", "organization_id", True, False),
    ("student_status_history", "organization_id", True, False),
]


def _policy_sql(table: str, org_column: str, nullable_org: bool) -> str:
    own_row = f"{org_column} = current_setting('app.current_org_id', true)::uuid"
    if nullable_org:
        own_row = f"({own_row} OR {org_column} IS NULL)"
    return f"""
    CREATE POLICY tenant_isolation_{table} ON student.{table}
        USING ({own_row} OR foundation.is_platform_user());
    """


CREATE_RLS = "\n".join(
    f"""
    ALTER TABLE student.{table} ENABLE ROW LEVEL SECURITY;
    {"ALTER TABLE student." + table + " FORCE ROW LEVEL SECURITY;" if force else ""}
    {_policy_sql(table, org_column, nullable_org)}
    """
    for table, org_column, force, nullable_org in RLS_TABLES
)

DROP_RLS = "\n".join(
    f"""
    DROP POLICY IF EXISTS tenant_isolation_{table} ON student.{table};
    ALTER TABLE student.{table} NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE student.{table} DISABLE ROW LEVEL SECURITY;
    """
    for table, _org_column, _force, _nullable_org in RLS_TABLES
)


class Migration(migrations.Migration):
    """Same two deliberate deviations as foundation/migrations/0004_rls.py:
    FORCE ROW LEVEL SECURITY (otherwise the table-owner role bypasses every
    policy) and the null-safe current_setting(..., true) form. Depends on
    foundation's is_platform_user() existing already.
    """

    dependencies = [
        ("student", "0002_triggers"),
        ("foundation", "0004_rls"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_RLS, reverse_sql=DROP_RLS),
    ]
