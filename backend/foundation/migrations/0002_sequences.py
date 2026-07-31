from django.db import migrations

CREATE_SEQUENCES = """
CREATE SEQUENCE IF NOT EXISTS foundation.login_id_seq START 100001;
CREATE SEQUENCE IF NOT EXISTS foundation.member_code_seq START 100001;
"""

DROP_SEQUENCES = """
DROP SEQUENCE IF EXISTS foundation.login_id_seq;
DROP SEQUENCE IF EXISTS foundation.member_code_seq;
"""


class Migration(migrations.Migration):
    """Sequences backing login_id/member_code generation — see
    foundation/managers.py (application code calls nextval() explicitly
    rather than a column DEFAULT expression, so generation stays easily
    unit-testable; the sequence itself is what guarantees no collisions).
    """

    dependencies = [
        ("foundation", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(sql=CREATE_SEQUENCES, reverse_sql=DROP_SEQUENCES),
    ]
