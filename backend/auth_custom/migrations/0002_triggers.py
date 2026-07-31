from django.db import migrations

# Only refresh_tokens and sessions have updated_at in the DDL — the other
# four (login_attempts, password_resets, email/phone_verifications) are
# create-only rows, matching foundation's update_updated_at() re-use pattern
# (the function is called cross-schema, which Postgres allows freely).
TABLES_WITH_UPDATED_AT = ["refresh_tokens", "sessions"]

CREATE_TRIGGERS = "\n".join(
    f"""
    CREATE TRIGGER trg_{table}_updated_at BEFORE UPDATE ON auth.{table}
        FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();
    """
    for table in TABLES_WITH_UPDATED_AT
)

DROP_TRIGGERS = "\n".join(
    f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON auth.{table};" for table in TABLES_WITH_UPDATED_AT
)


class Migration(migrations.Migration):
    dependencies = [
        ("auth_custom", "0001_initial"),
        ("foundation", "0003_triggers"),  # update_updated_at() must already exist
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_TRIGGERS, reverse_sql=DROP_TRIGGERS),
    ]
