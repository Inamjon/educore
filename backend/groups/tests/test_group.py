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
from groups.models import Group, GroupMember
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


def _make_student(org, **kwargs):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Sam", last_name="Student", password="pw123456",
        phone=f"+99891{uuid.uuid4().hex[:7]}",
    )
    kwargs.setdefault("student_code", f"STU-{uuid.uuid4().hex[:6]}")
    return StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=user, **kwargs)


def _make_group(org, **kwargs):
    kwargs.setdefault("course", _make_course(org))
    kwargs.setdefault("teacher", _make_teacher(org))
    kwargs.setdefault("code", f"GRP-{uuid.uuid4().hex[:8]}")
    kwargs.setdefault("name", "English B1 - Morning")
    kwargs.setdefault("start_date", "2026-09-01")
    return Group.objects.using(BYPASS_ALIAS).create(organization=org, **kwargs)


def test_group_code_unique_per_organization():
    org = _make_org()
    _make_group(org, code="ENG-B1-M01")

    with pytest.raises(IntegrityError):
        Group.objects.using(BYPASS_ALIAS).create(
            organization=org, course=_make_course(org), teacher=_make_teacher(org),
            code="ENG-B1-M01", name="Other", start_date="2026-09-01",
        )


def test_end_date_before_start_date_is_rejected():
    org = _make_org()
    with pytest.raises(IntegrityError):
        _make_group(org, start_date="2026-09-01", end_date="2026-08-01")


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    group = _make_group(org)
    group_id = group.id

    group.delete(using=BYPASS_ALIAS)

    assert not Group.objects.using(BYPASS_ALIAS).filter(id=group_id).exists()
    assert Group.all_objects.using(BYPASS_ALIAS).filter(id=group_id).exists()
    assert Group.all_objects.using(BYPASS_ALIAS).get(id=group_id).deleted_at is not None


def test_group_member_unique_per_student():
    org = _make_org()
    group = _make_group(org)
    student = _make_student(org)
    GroupMember.objects.using(BYPASS_ALIAS).create(organization=org, group=group, student_profile=student)

    with pytest.raises(IntegrityError):
        GroupMember.objects.using(BYPASS_ALIAS).create(organization=org, group=group, student_profile=student)


def test_deleting_group_cascades_to_members_and_attendance():
    org = _make_org()
    group = _make_group(org)
    student = _make_student(org)
    member = GroupMember.objects.using(BYPASS_ALIAS).create(organization=org, group=group, student_profile=student)
    record = Attendance.objects.using(BYPASS_ALIAS).create(
        organization=org, group=group, student_profile=student, date="2026-09-01"
    )

    group.delete(using=BYPASS_ALIAS)

    assert not GroupMember.objects.using(BYPASS_ALIAS).filter(id=member.id).exists()
    assert GroupMember.all_objects.using(BYPASS_ALIAS).get(id=member.id).deleted_at is not None
    assert not Attendance.objects.using(BYPASS_ALIAS).filter(id=record.id).exists()
    assert Attendance.all_objects.using(BYPASS_ALIAS).get(id=record.id).deleted_at is not None
