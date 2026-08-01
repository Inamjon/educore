"""Requires both `educore_app` and `educore_auth_bypass` Postgres roles to
already exist on whatever server runs the test suite (the latter needs
BYPASSRLS) — same roles a real deployment needs, see .env.example.
"""

import uuid

import pytest
from rest_framework.test import APIClient

from foundation.models import Organization, User

# transaction=True: LoginView reads/writes via the separate `auth_bypass_rls`
# connection alias. Under the default wrapped-transaction test isolation,
# that connection is a genuinely different DB session and can't see rows the
# `user` fixture inserted (but never committed) via `default` — Postgres
# MVCC hides uncommitted work from other sessions regardless of MIRROR/same
# physical DB. transaction=True makes fixtures actually commit (cleaned up
# via truncation after the test), so the bypass connection can see them.
pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)


@pytest.fixture
def user():
    # Unique slug per call, not a fixed literal: transaction=True's post-test
    # flush truncates via Django's introspected table list, which only sees
    # the default (unqualified) search_path — our tables live in named
    # schemas (foundation, auth, ...) outside it, so they never actually get
    # truncated between tests and a fixed slug would collide.
    org = Organization.objects.create(name="Org", slug=f"org-login-test-{uuid.uuid4().hex[:8]}", email="a@example.com")
    return User.objects.create_user(
        organization=org, first_name="Alice", last_name="Doe", password="s3cret-pass", status="active",
        email="alice.doe@example.com",
    )


def test_login_with_correct_credentials_returns_tokens(user):
    client = APIClient()
    response = client.post(
        "/api/v1/auth/login/", {"login_id": user.login_id, "password": "s3cret-pass"}, format="json"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "access" in body["data"] and "refresh" in body["data"]


def test_login_with_wrong_password_is_rejected(user):
    client = APIClient()
    response = client.post(
        "/api/v1/auth/login/", {"login_id": user.login_id, "password": "wrong-password"}, format="json"
    )

    assert response.status_code == 401
    assert response.json()["success"] is False


def test_login_for_suspended_account_is_rejected(user):
    user.status = "suspended"
    user.save(update_fields=["status"])

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
    access = login_response.json()["data"]["access"]

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    response = client.get("/api/v1/auth/sessions/")

    assert response.status_code == 200
    sessions = response.json()["data"]
    assert len(sessions) == 1
    assert sessions[0]["current"] is True
