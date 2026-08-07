from django.db import migrations

TABLES_WITH_UPDATED_AT = [
    "groups",
    "group_members",
]

# "group" is a reserved word — stays quoted in the raw SQL, same as the
# CREATE SCHEMA statement in 0001_initial.
CREATE_TRIGGERS = "\n".join(
    f"""
    CREATE TRIGGER trg_{table}_updated_at BEFORE INSERT OR UPDATE ON "group".{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)

DROP_TRIGGERS = "\n".join(
    f'DROP TRIGGER IF EXISTS trg_{table}_updated_at ON "group".{table};' for table in TABLES_WITH_UPDATED_AT
)


class Migration(migrations.Migration):
    dependencies = [
        ("groups", "0001_initial"),
        ("foundation", "0003_triggers"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_TRIGGERS, reverse_sql=DROP_TRIGGERS),
    ]
