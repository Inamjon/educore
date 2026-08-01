from django.db import migrations

# 0003_triggers wired trg_*_updated_at as BEFORE UPDATE only. Since `updated_at`
# has no Django-side default (see common/models.py::TimestampedMixin — the
# trigger is meant to be the sole writer), every INSERT violated the column's
# NOT NULL constraint. Re-create the same triggers as BEFORE INSERT OR UPDATE.
TABLES_WITH_UPDATED_AT = ["organizations", "branches", "users", "roles", "settings", "files"]

FIX_TRIGGERS = "\n".join(
    f"""
    DROP TRIGGER IF EXISTS trg_{table}_updated_at ON foundation.{table};
    CREATE TRIGGER trg_{table}_updated_at BEFORE INSERT OR UPDATE ON foundation.{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)

REVERT_TRIGGERS = "\n".join(
    f"""
    DROP TRIGGER IF EXISTS trg_{table}_updated_at ON foundation.{table};
    CREATE TRIGGER trg_{table}_updated_at BEFORE UPDATE ON foundation.{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)


class Migration(migrations.Migration):
    dependencies = [
        ("foundation", "0004_rls"),
    ]

    operations = [
        migrations.RunSQL(sql=FIX_TRIGGERS, reverse_sql=REVERT_TRIGGERS),
    ]
