from django.db import migrations

# 0003_triggers's TABLES_WITH_UPDATED_AT list omitted two tables whose models
# actually use TimestampedMixin: Permission (foundation/models/permission.py)
# and UserRole (foundation/models/bridges.py). Both were left with an
# `updated_at` column that nothing ever wrote to. Add the same
# BEFORE INSERT OR UPDATE trigger the other tables got in
# 0005_fix_updated_at_trigger_timing.
TABLES_WITH_UPDATED_AT = ["permissions", "user_roles"]

CREATE_TRIGGERS = "\n".join(
    f"""
    CREATE TRIGGER trg_{table}_updated_at BEFORE INSERT OR UPDATE ON foundation.{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)

DROP_TRIGGERS = "\n".join(
    f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON foundation.{table};" for table in TABLES_WITH_UPDATED_AT
)


class Migration(migrations.Migration):
    dependencies = [
        ("foundation", "0005_fix_updated_at_trigger_timing"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_TRIGGERS, reverse_sql=DROP_TRIGGERS),
    ]
