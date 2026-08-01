from django.db import migrations, models


class Migration(migrations.Migration):
    """No code path ever read foundation.User.email or .email_verified_at —
    login is by login_id, not email (see foundation/models/user.py), and
    phone + auth_custom.PhoneVerification are the only real contact/
    verification channel actually used. Removing both instead of leaving
    them "just in case" — reserving DB/index space for a column nothing
    writes to isn't a real safety margin, and every remaining User row is
    dev/seed data at this stage, not production data needing a backfill.
    """

    dependencies = [
        ("foundation", "0007_seed_permissions"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="user",
            name="chk_users_email_or_phone",
        ),
        migrations.RemoveField(
            model_name="user",
            name="email",
        ),
        migrations.RemoveField(
            model_name="user",
            name="email_verified_at",
        ),
        migrations.AlterField(
            model_name="user",
            name="phone",
            field=models.CharField(max_length=20),
        ),
    ]
