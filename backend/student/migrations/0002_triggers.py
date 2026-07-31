from django.db import migrations

# Reuses foundation.update_updated_at() (defined in foundation/migrations/
# 0003_triggers.py) — never redefine the function per schema, per Phase 1
# plan. student_status_history is excluded: it has no updated_at column
# (immutable, append-only).
TABLES_WITH_UPDATED_AT = ["student_profiles", "student_parents", "emergency_contacts", "student_documents"]

CREATE_TRIGGERS = "\n".join(
    f"""
    CREATE TRIGGER trg_{table}_updated_at BEFORE UPDATE ON student.{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)

DROP_TRIGGERS = "\n".join(
    f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON student.{table};" for table in TABLES_WITH_UPDATED_AT
)


class Migration(migrations.Migration):
    dependencies = [
        ("student", "0001_initial"),
        ("foundation", "0003_triggers"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_TRIGGERS, reverse_sql=DROP_TRIGGERS),
    ]
