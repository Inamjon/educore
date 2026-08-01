from django.db import migrations

# See foundation/migrations/0005_fix_updated_at_trigger_timing.py — same
# BEFORE-UPDATE-only bug, same fix.
TABLES_WITH_UPDATED_AT = ["student_profiles", "student_parents", "emergency_contacts", "student_documents"]

FIX_TRIGGERS = "\n".join(
    f"""
    DROP TRIGGER IF EXISTS trg_{table}_updated_at ON student.{table};
    CREATE TRIGGER trg_{table}_updated_at BEFORE INSERT OR UPDATE ON student.{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)

REVERT_TRIGGERS = "\n".join(
    f"""
    DROP TRIGGER IF EXISTS trg_{table}_updated_at ON student.{table};
    CREATE TRIGGER trg_{table}_updated_at BEFORE UPDATE ON student.{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)


class Migration(migrations.Migration):
    dependencies = [
        ("student", "0003_rls"),
    ]

    operations = [
        migrations.RunSQL(sql=FIX_TRIGGERS, reverse_sql=REVERT_TRIGGERS),
    ]
