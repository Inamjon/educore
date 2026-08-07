"""API-level tests for AuditLogViewSet — same "real login, not just ORM
objects" reasoning as attendance/tests/test_attendance_authorization.py:
HasModulePermission reads from request.user, and role/permission grants
only exist once foundation.signals's post_save provisioning has run.

Fixture setup goes through the auth_bypass_rls alias throughout — see
finance/tests/test_finance.py's module docstring for why, under
`transaction=True`, this is what's needed.

Cross-org isolation for this endpoint is enforced by Postgres RLS alone
(AuditLogViewSet's queryset has no application-level organization filter —
see the comment there). This file now runs against the real `educore_app`
connection (not a superuser/table-owner role), so — unlike when this
docstring was first written — `test_center_admin_cannot_see_other_orgs_audit_logs`
below is a genuine, load-bearing assertion of that RLS policy, not false
confidence.
"""

import uuid

import pytest
from django.db import transaction as db_transaction
from rest_framework.test import APIClient

from common.context import apply_org_context
from foundation.models import AuditLog, Organization, Role, User, UserRole

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org():
    org_id = uuid.uuid4()
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(
            id=org_id, name="Org", slug=f"org-audit-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
        )


def _make_login(org, phone, role_slug):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="U", last_name=phone[-4:], password="pw123456", phone=phone, status="active",
    )
    role = Role.objects.using(BYPASS_ALIAS).get(organization=org, slug=role_slug)
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=role, organization=org)
    return user


def _login(client, user):
    response = client.post("/api/v1/auth/login/", {"login_id": user.login_id, "password": "pw123456"}, format="json")
    assert response.status_code == 200
    return response


def test_center_admin_can_list_own_org_audit_logs():
    org = _make_org()
    admin_user = _make_login(org, "+998900400001", "center_admin")
    AuditLog.objects.using(BYPASS_ALIAS).create(organization=org, user=admin_user, action="create", entity_type="student_profile")

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


def test_center_admin_cannot_see_other_orgs_audit_logs():
    org_a = _make_org()
    org_b = _make_org()
    admin_a = _make_login(org_a, "+998900400003", "center_admin")
    admin_b = _make_login(org_b, "+998900400004", "center_admin")
    AuditLog.objects.using(BYPASS_ALIAS).create(organization=org_a, user=admin_a, action="create", entity_type="student_profile")
    AuditLog.objects.using(BYPASS_ALIAS).create(organization=org_b, user=admin_b, action="create", entity_type="teacher_profile")

    client = APIClient()
    _login(client, admin_a)
    response = client.get("/api/v1/audit-logs/")
    assert response.status_code == 200
    entity_types = {row["entity_type"] for row in response.json()["data"]["results"]}
    assert "student_profile" in entity_types
    assert "teacher_profile" not in entity_types
