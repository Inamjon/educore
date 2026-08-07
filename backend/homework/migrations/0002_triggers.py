from django.db import migrations

TABLES_WITH_UPDATED_AT = [
    "assignments",
    "submissions",
]

CREATE_TRIGGERS = "\n".join(
    f"""
    CREATE TRIGGER trg_{table}_updated_at BEFORE INSERT OR UPDATE ON homework.{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)

DROP_TRIGGERS = "\n".join(
    f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON homework.{table};" for table in TABLES_WITH_UPDATED_AT
)


class Migration(migrations.Migration):
    dependencies = [
        ("homework", "0001_initial"),
        ("foundation", "0003_triggers"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_TRIGGERS, reverse_sql=DROP_TRIGGERS),
    ]
