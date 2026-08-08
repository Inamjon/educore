"""See finance/tests/test_finance.py's module docstring for why fixture
setup goes through the auth_bypass_rls alias under `transaction=True`.
"""

import uuid

import pytest
from django.db import IntegrityError
from django.db import transaction as db_transaction

from attendance.models import Attendance
from common.context import apply_org_context
from course.models import Course
from foundation.models import Organization, User
from groups.models import Group
from student.models import StudentProfile
from teacher.models import TeacherProfile

pytestmark = pytest.mark.django_db(databases=["default", "auth_bypass_rls"], transaction=True)

BYPASS_ALIAS = "auth_bypass_rls"


def _make_org(**kwargs):
    org_id = uuid.uuid4()
    kwargs.setdefault("name", "Test Academy")
    kwargs.setdefault("slug", f"test-academy-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("email", "contact@test-academy.example")
    with db_transaction.atomic():
        apply_org_context(str(org_id))
        return Organization.objects.using(BYPASS_ALIAS).create(id=org_id, **kwargs)


def _make_course(org, **kwargs):
    kwargs.setdefault("code", f"CRS-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("name", "General English")
    kwargs.setdefault("category", "Languages")
    return Course.objects.using(BYPASS_ALIAS).create(organization=org, **kwargs)


def _make_teacher(org, **kwargs):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Sarah", last_name="Connor", password="pw123456",
        phone=f"+99890{uuid.uuid4().hex[:7]}",
    )
    kwargs.setdefault("teacher_code", f"TCH-{uuid.uuid4().hex[:6]}")
    return TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=user, **kwargs)


def _make_group(org, **kwargs):
    kwargs.setdefault("course", _make_course(org))
    kwargs.setdefault("teacher", _make_teacher(org))
    kwargs.setdefault("code", f"GRP-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("name", "English B1 - Morning")
    kwargs.setdefault("start_date", "2026-09-01")
    return Group.objects.using(BYPASS_ALIAS).create(organization=org, **kwargs)


def _make_student(org, **kwargs):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Sam", last_name="Student", password="pw123456",
        phone=f"+99891{uuid.uuid4().hex[:7]}",
    )
    kwargs.setdefault("student_code", f"STU-{uuid.uuid4().hex[:6]}")
    return StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=user, **kwargs)


def test_attendance_unique_per_group_student_date():
    org = _make_org()
    group = _make_group(org)
    student = _make_student(org)
    Attendance.objects.using(BYPASS_ALIAS).create(organization=org, group=group, student_profile=student, date="2026-09-01")

    with pytest.raises(IntegrityError):
        Attendance.objects.using(BYPASS_ALIAS).create(organization=org, group=group, student_profile=student, date="2026-09-01")


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    group = _make_group(org)
    student = _make_student(org)
    record = Attendance.objects.using(BYPASS_ALIAS).create(organization=org, group=group, student_profile=student, date="2026-09-01")
    record_id = record.id

    record.delete(using=BYPASS_ALIAS)

    assert not Attendance.objects.using(BYPASS_ALIAS).filter(id=record_id).exists()
    assert Attendance.all_objects.using(BYPASS_ALIAS).filter(id=record_id).exists()
    assert Attendance.all_objects.using(BYPASS_ALIAS).get(id=record_id).deleted_at is not None
