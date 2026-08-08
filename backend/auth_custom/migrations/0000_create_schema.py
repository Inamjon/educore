from django.db import migrations

# Same gap, same fix as foundation/migrations/0000_create_schema.py — the
# `auth` schema (auth_custom's tables — see common/db.py::schema_table("auth", ...)
# calls in this app's models) was hand-provisioned once for the original
# dev database and never had a tracked `CREATE SCHEMA` migration, so a
# fresh database (test DB, CI, a new dev machine) can't build itself.
class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.RunSQL(
            sql="CREATE SCHEMA IF NOT EXISTS auth;",
            reverse_sql="DROP SCHEMA IF EXISTS auth CASCADE;",
        ),
    ]
