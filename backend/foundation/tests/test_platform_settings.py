"""API-level tests for PlatformSettingsView/PlatformBrandingView (General +
Security panels) and the password-policy enforcement they drive. Same "real
login" reasoning as foundation/tests/test_user_self_update.py.

`security`/`general` are genuine platform-wide *singletons* (see
foundation.services.get_platform_setting) — every test that depends on a
particular value writes it explicitly first via BYPASS_ALIAS, rather than
assuming a default, since another test (or a previous run under
`--reuse-db`) may have already changed it.

Fixture setup goes through the auth_bypass_rls alias throughout — see
finance/tests/test_finance.py's module docstring for why, under
`transaction=True`, this is what's needed.
"""

import uuid

import pytest
from django.db import transaction as db_transaction
from rest_framework.test import APIClient

from common.context import apply_org_context
from foundation.models import Organization, Role, Setting, User, UserRole
from foundation.services import DEFAULT_GENERAL_SETTINGS, DEFAULT_SECURITY_SETTINGS

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org(**kwargs):
    org_id = uuid.uuid4()
    kwargs.setdefault("name", "Org")
    kwargs.setdefault("slug", f"org-platform-settings-test-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("email", "a@example.com")
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(id=org_id, **kwargs)


def _set_security(**overrides):
    Setting.objects.using(BYPASS_ALIAS).update_or_create(
        scope="platform", organization=None, branch=None, user=None, key="security",
        defaults={"value": {**DEFAULT_SECURITY_SETTINGS, **overrides}},
    )


def _make_super_admin_login(client, org, phone):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Super", last_name="Admin", password="pw123456", phone=phone, status="active",
    )
    system_role = Role.objects.using(BYPASS_ALIAS).filter(organization__isnull=True, slug="super_admin").first()
    if system_role is None:
        system_role = Role.objects.using(BYPASS_ALIAS).create(
            organization=None, name="Super Admin", slug="super_admin", is_system=True
        )
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=system_role, organization=org)
    response = client.post("/api/v1/auth/login/", {"login_id": user.login_id, "password": "pw123456"}, format="json")
    assert response.status_code == 200
    return user


def _make_login(org, phone, role_slug, password="pw123456"):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="U", last_name=phone[-4:], password=password, phone=phone, status="active",
    )
    role = Role.objects.using(BYPASS_ALIAS).get(organization=org, slug=role_slug)
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=role, organization=org)
    return user


def _login(client, user, password="pw123456"):
    response = client.post("/api/v1/auth/login/", {"login_id": user.login_id, "password": password}, format="json")
    assert response.status_code == 200
    return response


def test_platform_settings_has_general_and_security_keys():
    org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, org, "+998900820001")

    response = client.get("/api/v1/settings/platform/")

    assert response.status_code == 200
    body = response.json()["data"]
    assert set(DEFAULT_GENERAL_SETTINGS) <= set(body["general"])
    assert set(DEFAULT_SECURITY_SETTINGS) <= set(body["security"])


def test_super_admin_can_update_general_settings():
    org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, org, "+998900820002")

    response = client.put(
        "/api/v1/settings/platform/",
        {"general": {"platformName": "Acme LMS", "tagline": "Learn faster", "supportEmail": "help@acme.example"}},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["data"]["general"]["platformName"] == "Acme LMS"

    check = client.get("/api/v1/settings/platform/")
    assert check.json()["data"]["general"]["platformName"] == "Acme LMS"


def test_partial_general_update_does_not_wipe_other_fields():
    org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, org, "+998900820003")

    client.put(
        "/api/v1/settings/platform/",
        {"general": {"platformName": "First Name", "tagline": "Original tagline", "supportEmail": "a@example.com"}},
        format="json",
    )

    # Only platformName changes on this call — tagline/supportEmail must
    # survive, since PlatformSettingsView.put() merges into the current
    # value rather than replacing it outright.
    response = client.put("/api/v1/settings/platform/", {"general": {"platformName": "Second Name"}}, format="json")

    assert response.status_code == 200
    body = response.json()["data"]["general"]
    assert body["platformName"] == "Second Name"
    assert body["tagline"] == "Original tagline"
    assert body["supportEmail"] == "a@example.com"


def test_center_admin_cannot_view_or_update_platform_settings():
    org = _make_org()
    admin = _make_login(org, "+998900820004", "center_admin")
    client = APIClient()
    _login(client, admin)

    get_response = client.get("/api/v1/settings/platform/")
    put_response = client.put("/api/v1/settings/platform/", {"general": {"platformName": "Hijacked"}}, format="json")

    assert get_response.status_code == 403
    assert put_response.status_code == 403


def test_platform_branding_is_public_and_reflects_saved_general_settings():
    org = _make_org()
    client = APIClient()
    _make_super_admin_login(client, org, "+998900820005")
    client.put(
        "/api/v1/settings/platform/",
        {"general": {"platformName": "Branding Test Co", "tagline": "T", "supportEmail": "a@example.com"}},
        format="json",
    )

    # A fresh, never-authenticated client — the login page's own scenario.
    anonymous_client = APIClient()
    response = anonymous_client.get("/api/v1/settings/platform/branding/")

    assert response.status_code == 200
    assert response.json()["data"]["platformName"] == "Branding Test Co"
    # Only the public-facing subset — never security config.
    assert "security" not in response.json()["data"]
    assert "maxLoginAttempts" not in response.json()["data"]


def test_password_policy_basic_rejects_a_short_password():
    _set_security(passwordPolicy="basic")
    org = _make_org()
    user = _make_login(org, "+998900820006", "teacher")
    client = APIClient()
    _login(client, user)

    response = client.patch(
        f"/api/v1/users/{user.id}/", {"password": "short1", "current_password": "pw123456"}, format="json"
    )

    assert response.status_code == 400


def test_password_policy_strong_rejects_password_without_special_character():
    _set_security(passwordPolicy="strong")
    org = _make_org()
    user = _make_login(org, "+998900820007", "teacher")
    client = APIClient()
    _login(client, user)

    response = client.patch(
        f"/api/v1/users/{user.id}/",
        {"password": "abcdefghijkl123", "current_password": "pw123456"},  # 15 chars, no special char
        format="json",
    )

    assert response.status_code == 400


def test_password_policy_strong_accepts_a_qualifying_password():
    _set_security(passwordPolicy="strong")
    org = _make_org()
    user = _make_login(org, "+998900820008", "teacher")
    client = APIClient()
    _login(client, user)

    response = client.patch(
        f"/api/v1/users/{user.id}/",
        {"password": "abcdefghijkl!23", "current_password": "pw123456"},
        format="json",
    )

    assert response.status_code == 200
