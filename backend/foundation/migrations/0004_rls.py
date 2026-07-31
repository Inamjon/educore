from django.db import migrations

# `foundation.is_platform_user()` lets users holding a system-level role
# (roles.organization_id IS NULL, e.g. super_admin) see across every
# organization instead of being scoped to just their own — needed for the
# Super-Admin frontend portal's core purpose (managing all centers).
#
# SECURITY DEFINER: executes as the function's OWNER (the migration/table-
# owner role), which is why `roles`/`user_roles` below are deliberately left
# WITHOUT `FORCE ROW LEVEL SECURITY` — FORCE would make the owner subject to
# RLS too, and this function would then be blocked by the very policy it's
# meant to evaluate (circular). The app's own DB role is NOT the owner, so
# its direct queries against `roles`/`user_roles` are still fully subject to
# RLS regardless — only this one narrowly-scoped, read-only lookup bypasses it.
CREATE_HELPER_FUNCTION = """
CREATE OR REPLACE FUNCTION foundation.is_platform_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM foundation.user_roles ur
        JOIN foundation.roles r ON r.id = ur.role_id
        WHERE ur.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
          AND r.organization_id IS NULL
          AND r.is_active = true
    );
$$;
"""

DROP_HELPER_FUNCTION = "DROP FUNCTION IF EXISTS foundation.is_platform_user();"

# (table, org_column, force_rls, nullable_org)
RLS_TABLES = [
    ("organizations", "id", True, False),
    ("branches", "organization_id", True, False),
    ("users", "organization_id", True, False),
    ("roles", "organization_id", False, True),
    ("user_roles", "organization_id", False, False),
    ("settings", "organization_id", True, True),
    ("audit_logs", "organization_id", True, True),
    ("files", "organization_id", True, False),
]


def _policy_sql(table: str, org_column: str, nullable_org: bool) -> str:
    own_row = f"{org_column} = current_setting('app.current_org_id', true)::uuid"
    if nullable_org:
        own_row = f"({own_row} OR {org_column} IS NULL)"
    return f"""
    CREATE POLICY tenant_isolation_{table} ON foundation.{table}
        USING ({own_row} OR foundation.is_platform_user());
    """


CREATE_RLS = CREATE_HELPER_FUNCTION + "\n".join(
    f"""
    ALTER TABLE foundation.{table} ENABLE ROW LEVEL SECURITY;
    {"ALTER TABLE foundation." + table + " FORCE ROW LEVEL SECURITY;" if force else ""}
    {_policy_sql(table, org_column, nullable_org)}
    """
    for table, org_column, force, nullable_org in RLS_TABLES
)

DROP_RLS = "\n".join(
    f"""
    DROP POLICY IF EXISTS tenant_isolation_{table} ON foundation.{table};
    ALTER TABLE foundation.{table} NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE foundation.{table} DISABLE ROW LEVEL SECURITY;
    """
    for table, _org_column, _force, _nullable_org in RLS_TABLES
) + DROP_HELPER_FUNCTION


class Migration(migrations.Migration):
    """Postgres RLS as defense-in-depth on top of the app-layer org filter
    (the primary control). Two deliberate deviations from a literal reading
    of database/*.sql, both required for RLS to actually do anything:

      - FORCE ROW LEVEL SECURITY (the original docs never set it — without
        it, the table *owner* role bypasses every policy silently, making
        the whole layer a no-op as long as Django connects as the owner).
      - `current_setting(..., true)` (null-safe form) everywhere, instead of
        the one-arg form, which hard-errors instead of returning NULL for
        any code path that never went through org-context resolution
        (management commands, health checks, the login lookup itself).
    """

    dependencies = [
        ("foundation", "0003_triggers"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_RLS, reverse_sql=DROP_RLS),
    ]
