from django.db import migrations

CREATE_FUNCTION = """
CREATE OR REPLACE FUNCTION foundation.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""

DROP_FUNCTION = "DROP FUNCTION IF EXISTS foundation.update_updated_at() CASCADE;"

# Only tables that actually have `updated_at` (permissions/user_roles/
# role_permissions/audit_logs deliberately excluded, matching the DDL).
TABLES_WITH_UPDATED_AT = ["organizations", "branches", "users", "roles", "settings", "files"]

CREATE_TRIGGERS = "\n".join(
    f"""
    CREATE TRIGGER trg_{table}_updated_at BEFORE UPDATE ON foundation.{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)

DROP_TRIGGERS = "\n".join(
    f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON foundation.{table};"
    for table in TABLES_WITH_UPDATED_AT
)


class Migration(migrations.Migration):
    """`updated_at` is intentionally NOT Django's `auto_now=True` — this
    Postgres trigger is the single source of truth for it (see
    common/models.py::TimestampedMixin), so it stays correct even for rows
    written outside Django.
    """

    dependencies = [
        ("foundation", "0002_sequences"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_FUNCTION, reverse_sql=DROP_FUNCTION),
        migrations.RunSQL(sql=CREATE_TRIGGERS, reverse_sql=DROP_TRIGGERS),
    ]
