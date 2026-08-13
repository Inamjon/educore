"""API-level tests for the teacher-owns-group check in AttendanceViewSet —
see the matching comment in attendance/views.py::_check_owns_group. Needs a
real login (not just ORM objects) since HasModulePermission + the ownership
check both read from request.user, and role/permission grants only exist
once foundation.signals's post_save provisioning has actually run.

Fixture setup goes through the auth_bypass_rls alias throughout — see
finance/tests/test_finance.py's module docstring for why, under
`transaction=True`, this is what's needed.
"""

import uuid

import pytest
from django.db import transaction as db_transaction
from rest_framework.test import APIClient

from attendance.models import Attendance
from common.context import apply_org_context
from course.models import Course
from foundation.models import Organization, Role, User, UserRole
from groups.models import Group
from student.models import StudentProfile
from teacher.models import TeacherProfile

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org():
    org_id = uuid.uuid4()
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(
            id=org_id, name="Org", slug=f"org-attendance-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
        )


def _make_teacher_login(org, phone):
    """Creates a User + TeacherProfile, assigns the org's auto-provisioned
    'teacher' role (see foundation/signals.py), and returns (user, profile).
    """
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="T", last_name=phone[-4:], password="pw123456", phone=phone, status="active",
    )
    role = Role.objects.using(BYPASS_ALIAS).get(organization=org, slug="teacher")
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=role, organization=org)
    profile = TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=user, teacher_code=f"TCH-{phone[-4:]}")
    return user, profile


def _make_student_login(org, phone):
    """Same shape as _make_teacher_login but for the org's auto-provisioned
    'student' role, returning (user, profile).
    """
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="S", last_name=phone[-4:], password="pw123456", phone=phone, status="active",
    )
    role = Role.objects.using(BYPASS_ALIAS).get(organization=org, slug="student")
    UserRole.objects.using(BYPASS_ALIAS).create(user=user, role=role, organization=org)
    profile = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=user, student_code=f"STU-{phone[-4:]}")
    return user, profile


def test_teacher_cannot_mark_attendance_for_another_teachers_group():
    org = _make_org()
    course = Course.objects.using(BYPASS_ALIAS).create(organization=org, name="Course", code="CRS-1", category="General")
    _teacher_a_user, teacher_a = _make_teacher_login(org, "+998900000001")
    teacher_b_user, teacher_b = _make_teacher_login(org, "+998900000002")

    group_a = Group.objects.using(BYPASS_ALIAS).create(
        organization=org, course=course, teacher=teacher_a, code="GRP-A", name="Group A", start_date="2026-09-01"
    )
    student_user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="S", last_name="One", password="pw123456", phone="+998900000003",
    )
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-1")

    client = APIClient()
    login = client.post(
        "/api/v1/auth/login/", {"login_id": teacher_b_user.login_id, "password": "pw123456"}, format="json"
    )
    assert login.status_code == 200

    response = client.post(
        "/api/v1/attendance/",
        {"organization": str(org.id), "group": str(group_a.id), "student_profile": str(student.id), "date": "2026-09-01"},
        format="json",
    )

    assert response.status_code == 403


def test_teacher_can_mark_attendance_for_own_group():
    org = _make_org()
    course = Course.objects.using(BYPASS_ALIAS).create(organization=org, name="Course", code="CRS-2", category="General")
    teacher_a_user, teacher_a = _make_teacher_login(org, "+998900000004")

    group_a = Group.objects.using(BYPASS_ALIAS).create(
        organization=org, course=course, teacher=teacher_a, code="GRP-B", name="Group B", start_date="2026-09-01"
    )
    student_user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="S", last_name="Two", password="pw123456", phone="+998900000005",
    )
    student = StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=student_user, student_code="STU-2")

    client = APIClient()
    login = client.post(
        "/api/v1/auth/login/", {"login_id": teacher_a_user.login_id, "password": "pw123456"}, format="json"
    )
    assert login.status_code == 200

    response = client.post(
        "/api/v1/attendance/",
        {"organization": str(org.id), "group": str(group_a.id), "student_profile": str(student.id), "date": "2026-09-01", "status": "present"},
        format="json",
    )

    assert response.status_code == 201
    body = response.json()["data"]
    assert body["marked_by"] == str(teacher_a_user.id)


def test_student_cannot_see_classmates_attendance():
    """AttendanceViewSet.get_queryset() row-scopes a student caller to their
    own student_profile — see the matching comment there. Without it,
    attendance:view (module-wide, and every student role holds it per
    DEFAULT_ROLE_PERMISSIONS) would let one student read every other
    student's attendance status/notes.
    """
    org = _make_org()
    course = Course.objects.using(BYPASS_ALIAS).create(organization=org, name="Course", code="CRS-3", category="General")
    _teacher_user, teacher = _make_teacher_login(org, "+998900000006")
    group = Group.objects.using(BYPASS_ALIAS).create(
        organization=org, course=course, teacher=teacher, code="GRP-C", name="Group C", start_date="2026-09-01"
    )

    student_a_user, student_a = _make_student_login(org, "+998900000007")
    _student_b_user, student_b = _make_student_login(org, "+998900000008")

    Attendance.objects.using(BYPASS_ALIAS).create(
        organization=org, group=group, student_profile=student_a, date="2026-09-01", status="present"
    )
    record_b = Attendance.objects.using(BYPASS_ALIAS).create(
        organization=org, group=group, student_profile=student_b, date="2026-09-01", status="absent"
    )

    client = APIClient()
    login = client.post(
        "/api/v1/auth/login/", {"login_id": student_a_user.login_id, "password": "pw123456"}, format="json"
    )
    assert login.status_code == 200

    list_response = client.get(f"/api/v1/attendance/?organization={org.id}")
    assert list_response.status_code == 200
    ids = [r["id"] for r in list_response.json()["data"]["results"]]
    assert str(record_b.id) not in ids

    detail_response = client.get(f"/api/v1/attendance/{record_b.id}/")
    assert detail_response.status_code == 404


def test_teacher_cannot_see_another_teachers_group_attendance():
    """Same row-scoping, teacher side: attendance:view is module-wide, but a
    teacher should still only read attendance for groups they teach.
    """
    org = _make_org()
    course = Course.objects.using(BYPASS_ALIAS).create(organization=org, name="Course", code="CRS-4", category="General")
    _teacher_a_user, teacher_a = _make_teacher_login(org, "+998900000009")
    teacher_b_user, teacher_b = _make_teacher_login(org, "+998900000010")

    group_a = Group.objects.using(BYPASS_ALIAS).create(
        organization=org, course=course, teacher=teacher_a, code="GRP-D", name="Group D", start_date="2026-09-01"
    )
    group_b = Group.objects.using(BYPASS_ALIAS).create(
        organization=org, course=course, teacher=teacher_b, code="GRP-E", name="Group E", start_date="2026-09-01"
    )
    _student_user, student = _make_student_login(org, "+998900000011")

    record_a = Attendance.objects.using(BYPASS_ALIAS).create(
        organization=org, group=group_a, student_profile=student, date="2026-09-01", status="present"
    )

    client = APIClient()
    login = client.post(
        "/api/v1/auth/login/", {"login_id": teacher_b_user.login_id, "password": "pw123456"}, format="json"
    )
    assert login.status_code == 200

    list_response = client.get(f"/api/v1/attendance/?organization={org.id}")
    assert list_response.status_code == 200
    ids = [r["id"] for r in list_response.json()["data"]["results"]]
    assert str(record_a.id) not in ids

    # group_b sanity check: teacher_b's own group attendance still visible
    record_b = Attendance.objects.using(BYPASS_ALIAS).create(
        organization=org, group=group_b, student_profile=student, date="2026-09-01", status="present"
    )
    list_response_2 = client.get(f"/api/v1/attendance/?organization={org.id}")
    ids_2 = [r["id"] for r in list_response_2.json()["data"]["results"]]
    assert str(record_b.id) in ids_2
