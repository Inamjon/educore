"""API-level tests for the teacher-owns-group check in AttendanceViewSet —
see the matching comment in attendance/views.py::_check_owns_group. Needs a
real login (not just ORM objects) since HasModulePermission + the ownership
check both read from request.user, and role/permission grants only exist
once foundation.signals's post_save provisioning has actually run.
"""

import uuid

import pytest
from rest_framework.test import APIClient

from course.models import Course
from foundation.models import Organization, Role, User, UserRole
from groups.models import Group
from student.models import StudentProfile
from teacher.models import TeacherProfile

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)


def _make_org():
    return Organization.objects.create(
        name="Org", slug=f"org-attendance-test-{uuid.uuid4().hex[:8]}", email="a@example.com"
    )


def _make_teacher_login(org, phone):
    """Creates a User + TeacherProfile, assigns the org's auto-provisioned
    'teacher' role (see foundation/signals.py), and returns (user, profile).
    """
    user = User.objects.create_user(
        organization=org, first_name="T", last_name=phone[-4:], password="pw123456", phone=phone, status="active",
    )
    role = Role.objects.get(organization=org, slug="teacher")
    UserRole.objects.create(user=user, role=role, organization=org)
    profile = TeacherProfile.objects.create(organization=org, user=user, teacher_code=f"TCH-{phone[-4:]}")
    return user, profile


def test_teacher_cannot_mark_attendance_for_another_teachers_group():
    org = _make_org()
    course = Course.objects.create(organization=org, name="Course", code="CRS-1", category="General")
    _teacher_a_user, teacher_a = _make_teacher_login(org, "+998900000001")
    teacher_b_user, teacher_b = _make_teacher_login(org, "+998900000002")

    group_a = Group.objects.create(
        organization=org, course=course, teacher=teacher_a, code="GRP-A", name="Group A", start_date="2026-09-01"
    )
    student_user = User.objects.create_user(
        organization=org, first_name="S", last_name="One", password="pw123456", phone="+998900000003",
    )
    student = StudentProfile.objects.create(organization=org, user=student_user, student_code="STU-1")

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
    course = Course.objects.create(organization=org, name="Course", code="CRS-2", category="General")
    teacher_a_user, teacher_a = _make_teacher_login(org, "+998900000004")

    group_a = Group.objects.create(
        organization=org, course=course, teacher=teacher_a, code="GRP-B", name="Group B", start_date="2026-09-01"
    )
    student_user = User.objects.create_user(
        organization=org, first_name="S", last_name="Two", password="pw123456", phone="+998900000005",
    )
    student = StudentProfile.objects.create(organization=org, user=student_user, student_code="STU-2")

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
