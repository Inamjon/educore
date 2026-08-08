"""Requires both `educore_app` and `educore_auth_bypass` Postgres roles to
already exist on whatever server runs the test suite (the latter needs
BYPASSRLS) — same roles a real deployment needs, see .env.example.
"""

import uuid

import pytest
from django.db import transaction as db_transaction
from rest_framework.test import APIClient

from common.context import apply_org_context
from foundation.models import Organization, User

# transaction=True: LoginView reads/writes via the separate `auth_bypass_rls`
# connection alias. Under the default wrapped-transaction test isolation,
# that connection is a genuinely different DB session and can't see rows the
# `user` fixture inserted (but never committed) via `default` — Postgres
# MVCC hides uncommitted work from other sessions regardless of MIRROR/same
# physical DB. transaction=True makes fixtures actually commit (cleaned up
# via truncation after the test), so the bypass connection can see them.
pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


@pytest.fixture
def user():
    # Unique slug per call, not a fixed literal: transaction=True's post-test
    # flush truncates via Django's introspected table list, which only sees
    # the default (unqualified) search_path — our tables live in named
    # schemas (foundation, auth, ...) outside it, so they never actually get
    # truncated between tests and a fixed slug would collide.
    #
    # Created via the auth_bypass_rls alias, org id pre-generated and org
    # context applied first — an Organization's own id can't satisfy its RLS
    # policy at insert time otherwise (see finance/tests/test_finance.py's
    # module docstring for the full chicken-and-egg reasoning).
    org_id = uuid.uuid4()
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        org = Organization.objects.using(BYPASS_ALIAS).create(
            id=org_id, name="Org", slug=f"org-login-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
        )
    return User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Alice", last_name="Doe", password="s3cret-pass", status="active",
        phone="+998901234567",
    )


def test_login_with_correct_credentials_returns_tokens(user):
    client = APIClient()
    response = client.post(
        "/api/v1/auth/login/", {"login_id": user.login_id, "password": "s3cret-pass"}, format="json"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "access_token" in response.cookies and "refresh_token" in response.cookies
    assert response.cookies["access_token"]["httponly"]
    assert "access" not in body["data"] and "refresh" not in body["data"]


def test_login_with_wrong_password_is_rejected(user):
    client = APIClient()
    response = client.post(
        "/api/v1/auth/login/", {"login_id": user.login_id, "password": "wrong-password"}, format="json"
    )

    assert response.status_code == 401
    assert response.json()["success"] is False


def test_login_for_suspended_account_is_rejected(user):
    user.status = "suspended"
    user.save(using=BYPASS_ALIAS, update_fields=["status"])

    client = APIClient()
    response = client.post(
        "/api/v1/auth/login/", {"login_id": user.login_id, "password": "s3cret-pass"}, format="json"
    )

    assert response.status_code == 401


def test_authenticated_request_can_list_own_sessions(user):
    client = APIClient()
    login_response = client.post(
        "/api/v1/auth/login/", {"login_id": user.login_id, "password": "s3cret-pass"}, format="json"
    )
    assert login_response.status_code == 200

    # APIClient carries cookies between calls on the same instance, same as
    # a real browser — no manual Authorization header needed.
    response = client.get("/api/v1/auth/sessions/")

    assert response.status_code == 200
    sessions = response.json()["data"]
    assert len(sessions) == 1
    assert sessions[0]["current"] is True


def test_logout_revokes_current_session(user):
    """Regression test: LogoutView revoking request.auth's own session row
    used to deadlock — SessionValidatingJWTAuthentication's last_activity_at
    UPDATE (via `default`) held a lock the logout revoke's UPDATE (via
    BYPASS_ALIAS, a second connection) then blocked on, inside the same
    request-wide transaction.atomic() from OrganizationContextMiddleware.
    """
    client = APIClient()
    login_response = client.post(
        "/api/v1/auth/login/", {"login_id": user.login_id, "password": "s3cret-pass"}, format="json"
    )
    assert login_response.status_code == 200

    logout_response = client.post("/api/v1/auth/logout/")
    assert logout_response.status_code == 200
    assert logout_response.json()["success"] is True

    response = client.get("/api/v1/auth/sessions/")
    assert response.status_code == 401
