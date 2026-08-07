"""Model-level tests plus API-level tests for the "always your own inbox"
scoping in NotificationViewSet.get_queryset() — needs a real login (not just
ORM objects) since HasModulePermission reads from request.user and role
grants only exist once foundation.signals's post_save provisioning has run,
same reasoning as attendance/tests/test_attendance_authorization.py.

Fixture setup goes through the auth_bypass_rls alias throughout — see
finance/tests/test_finance.py's module docstring for why, under
`transaction=True`, this is what's needed.
"""

import uuid

import pytest
from django.db import transaction as db_transaction
from rest_framework.test import APIClient

from common.context import apply_org_context
from foundation.models import Organization, Role, User, UserRole
from notifications.models import Notification

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org():
    org_id = uuid.uuid4()
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(
            id=org_id, name="Org", slug=f"org-notif-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
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


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    recipient = _make_login(org, "+998900100001", "student")
    notification = Notification.objects.using(BYPASS_ALIAS).create(organization=org, recipient=recipient, title="Hi", message="Hello")
    notification_id = notification.id

    notification.delete(using=BYPASS_ALIAS)

    assert not Notification.objects.using(BYPASS_ALIAS).filter(id=notification_id).exists()
    assert Notification.all_objects.using(BYPASS_ALIAS).filter(id=notification_id).exists()
    assert Notification.all_objects.using(BYPASS_ALIAS).get(id=notification_id).deleted_at is not None


def test_recipient_cannot_see_other_recipients_notification():
    org = _make_org()
    teacher = _make_login(org, "+998900100002", "teacher")
    student_a = _make_login(org, "+998900100003", "student")
    student_b = _make_login(org, "+998900100004", "student")

    client = APIClient()
    _login(client, teacher)
    create = client.post(
        "/api/v1/notifications/",
        {"organization": str(org.id), "recipient": str(student_a.id), "title": "Homework", "message": "Due Friday"},
        format="json",
    )
    assert create.status_code == 201
    notification_id = create.json()["data"]["id"]

    client_b = APIClient()
    _login(client_b, student_b)

    list_response = client_b.get("/api/v1/notifications/")
    assert list_response.status_code == 200
    ids = [n["id"] for n in list_response.json()["data"]["results"]]
    assert notification_id not in ids

    detail_response = client_b.get(f"/api/v1/notifications/{notification_id}/")
    assert detail_response.status_code == 404


def test_recipient_can_see_and_mark_own_notification_read():
    org = _make_org()
    teacher = _make_login(org, "+998900100005", "teacher")
    student = _make_login(org, "+998900100006", "student")

    client = APIClient()
    _login(client, teacher)
    create = client.post(
        "/api/v1/notifications/",
        {"organization": str(org.id), "recipient": str(student.id), "title": "Homework", "message": "Due Friday"},
        format="json",
    )
    assert create.status_code == 201
    notification_id = create.json()["data"]["id"]

    client_student = APIClient()
    _login(client_student, student)

    detail = client_student.get(f"/api/v1/notifications/{notification_id}/")
    assert detail.status_code == 200
    assert detail.json()["data"]["read"] is False

    patch = client_student.patch(f"/api/v1/notifications/{notification_id}/", {"read": True}, format="json")
    assert patch.status_code == 200
    body = patch.json()["data"]
    assert body["read"] is True
    assert body["read_at"] is not None


def test_student_cannot_send_notifications():
    org = _make_org()
    student = _make_login(org, "+998900100007", "student")
    other_student = _make_login(org, "+998900100008", "student")

    client = APIClient()
    _login(client, student)
    response = client.post(
        "/api/v1/notifications/",
        {"organization": str(org.id), "recipient": str(other_student.id), "title": "Hi", "message": "Hey"},
        format="json",
    )
    assert response.status_code == 403


def test_recipient_must_belong_to_same_organization():
    org_a = _make_org()
    org_b = _make_org()
    teacher = _make_login(org_a, "+998900100009", "teacher")
    outsider = _make_login(org_b, "+998900100010", "student")

    client = APIClient()
    _login(client, teacher)
    response = client.post(
        "/api/v1/notifications/",
        {"organization": str(org_a.id), "recipient": str(outsider.id), "title": "Hi", "message": "Hey"},
        format="json",
    )
    assert response.status_code == 400
