"""API-level tests for AuditLogViewSet — same "real login, not just ORM
objects" reasoning as attendance/tests/test_attendance_authorization.py:
HasModulePermission reads from request.user, and role/permission grants
only exist once foundation.signals's post_save provisioning has run.

Cross-org isolation for this endpoint is enforced by Postgres RLS alone
(AuditLogViewSet's queryset has no application-level organization filter —
see the comment there). That guarantee is NOT exercised by this test file:
this whole suite runs against the DB_USER=postgres connection (see
backend/README.md's test-setup step), and postgres — being the table
owner/superuser — bypasses RLS entirely regardless of what policies exist.
A test here asserting cross-org isolation would pass even if the RLS
policy were deleted outright, which makes it worse than no test: false
confidence. The actual guarantee was instead verified by hand against the
real dev server (real `educore_app` connection, RLS fully active) — see
educore-backend-phase0 memory. Worth fixing properly (a test path that
runs fixture setup as postgres/bypass but the actual request-under-test as
plain `educore_app`) as a follow-up; out of scope for this change.
"""

import uuid

import pytest
from rest_framework.test import APIClient

from foundation.models import AuditLog, Organization, Role, User, UserRole

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)


def _make_org():
    return Organization.objects.create(
        name="Org", slug=f"org-audit-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
    )


def _make_login(org, phone, role_slug):
    user = User.objects.create_user(
        organization=org, first_name="U", last_name=phone[-4:], password="pw123456", phone=phone, status="active",
    )
    role = Role.objects.get(organization=org, slug=role_slug)
    UserRole.objects.create(user=user, role=role, organization=org)
    return user


def _login(client, user):
    response = client.post("/api/v1/auth/login/", {"login_id": user.login_id, "password": "pw123456"}, format="json")
    assert response.status_code == 200
    return response


def test_center_admin_can_list_own_org_audit_logs():
    org = _make_org()
    admin_user = _make_login(org, "+998900400001", "center_admin")
    AuditLog.objects.create(organization=org, user=admin_user, action="create", entity_type="student_profile")

    client = APIClient()
    _login(client, admin_user)
    response = client.get("/api/v1/audit-logs/")
    assert response.status_code == 200
    entity_types = [row["entity_type"] for row in response.json()["data"]["results"]]
    assert "student_profile" in entity_types


def test_teacher_cannot_list_audit_logs():
    org = _make_org()
    teacher_user = _make_login(org, "+998900400002", "teacher")

    client = APIClient()
    _login(client, teacher_user)
    response = client.get("/api/v1/audit-logs/")
    assert response.status_code == 403
