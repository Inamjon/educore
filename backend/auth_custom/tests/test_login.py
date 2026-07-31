"""Requires both `educore_app` and `educore_auth_bypass` Postgres roles to
already exist on whatever server runs the test suite (the latter needs
BYPASSRLS) — same roles a real deployment needs, see .env.example.
"""

import pytest
from rest_framework.test import APIClient

from foundation.models import Organization, User

pytestmark = pytest.mark.django_db


@pytest.fixture
def user():
    org = Organization.objects.create(name="Org", slug="org-login-test", email="a@example.com")
    return User.objects.create_user(
        organization=org, first_name="Alice", last_name="Doe", password="s3cret-pass", status="active"
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
