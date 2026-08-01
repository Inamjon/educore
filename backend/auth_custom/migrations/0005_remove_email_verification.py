from django.db import migrations

# Reverse of the tenant_isolation_email_verifications policy from
# 0003_rls.py — has to run before DeleteModel drops the table.
DROP_RLS = """
DROP POLICY IF EXISTS tenant_isolation_email_verifications ON auth.email_verifications;
ALTER TABLE auth.email_verifications NO FORCE ROW LEVEL SECURITY;
ALTER TABLE auth.email_verifications DISABLE ROW LEVEL SECURITY;
"""

RESTORE_RLS = """
ALTER TABLE auth.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.email_verifications FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_email_verifications ON auth.email_verifications
    USING (organization_id = current_setting('app.current_org_id', true)::uuid OR foundation.is_platform_user());
"""


class Migration(migrations.Migration):
    """foundation.User no longer has an email field (see foundation's
    matching migration) — nothing collects a user's email anymore, so
    email-address verification has no input to verify. No view ever
    referenced this model (checked: no email-verify endpoint exists in
    auth_custom/urls.py), so this is dead schema, not a feature removal.
    """

    dependencies = [
        ("auth_custom", "0004_fix_updated_at_trigger_timing"),
    ]

    operations = [
        migrations.RunSQL(sql=DROP_RLS, reverse_sql=RESTORE_RLS),
        migrations.DeleteModel(name="EmailVerification"),
    ]
