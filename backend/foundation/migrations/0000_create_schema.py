from django.db import migrations

# Unlike every other app (see e.g. finance/migrations/0001_initial.py's
# identical RunSQL), foundation's own `CREATE SCHEMA` step was never in a
# tracked migration — the `foundation` schema was created once, directly,
# when the very first "educore" dev database was hand-provisioned from
# database/02-foundation.sql, so `0001_initial` (added later, Django-only)
# never needed it there. That's invisible on that one already-provisioned
# database, but it means Django can never build a *fresh* database (a new
# test database, a new dev machine, CI) on its own — `manage.py test`/pytest
# fails with `schema "foundation" does not exist` on the very first
# CreateModel. `0001_initial` now depends on this migration (below), so a
# fresh database gets the schema created before anything tries to use it;
# on the already-provisioned database this is a harmless no-op
# (`IF NOT EXISTS`).
class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.RunSQL(
            sql="CREATE SCHEMA IF NOT EXISTS foundation;",
            reverse_sql="DROP SCHEMA IF EXISTS foundation CASCADE;",
        ),
    ]
