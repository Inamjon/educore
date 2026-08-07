import pytest
from django.db import IntegrityError

from course.models import Course
from foundation.models import Organization, User
from groups.models import Group, GroupMember
from teacher.models import TeacherProfile

pytestmark = pytest.mark.django_db


def _make_org(**kwargs):
    kwargs.setdefault("name", "Test Academy")
    kwargs.setdefault("slug", f"test-academy-{Organization.objects.count()}")
    kwargs.setdefault("email", "contact@test-academy.example")
    return Organization.objects.create(**kwargs)


def _make_course(org, **kwargs):
    kwargs.setdefault("code", f"CRS-{Course.objects.count() + 1}")
    kwargs.setdefault("name", "General English")
    kwargs.setdefault("category", "Languages")
    return Course.objects.create(organization=org, **kwargs)


def _make_teacher(org, **kwargs):
    user = User.objects.create_user(
        organization=org, first_name="Sarah", last_name="Connor", password="pw123456",
        phone=f"+99890{TeacherProfile.objects.count():07d}",
    )
    kwargs.setdefault("teacher_code", f"TCH-{TeacherProfile.objects.count() + 1}")
    return TeacherProfile.objects.create(organization=org, user=user, **kwargs)


def _make_group(org, **kwargs):
    kwargs.setdefault("course", _make_course(org))
    kwargs.setdefault("teacher", _make_teacher(org))
    kwargs.setdefault("code", f"GRP-{Group.objects.count() + 1}")
    kwargs.setdefault("name", "English B1 - Morning")
    kwargs.setdefault("start_date", "2026-09-01")
    return Group.objects.create(organization=org, **kwargs)


def test_group_code_unique_per_organization():
    org = _make_org()
    _make_group(org, code="ENG-B1-M01")

    with pytest.raises(IntegrityError):
        Group.objects.create(
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

    group.delete()

    assert not Group.objects.filter(id=group_id).exists()
    assert Group.all_objects.filter(id=group_id).exists()
    assert Group.all_objects.get(id=group_id).deleted_at is not None


def test_group_member_unique_per_student():
    org = _make_org()
    group = _make_group(org)
    user = User.objects.create_user(organization=org, first_name="Sam", last_name="Student", password="pw123456", phone="+998900000099")
    from student.models import StudentProfile

    student = StudentProfile.objects.create(organization=org, user=user, student_code="STU-1")
    GroupMember.objects.create(organization=org, group=group, student_profile=student)

    with pytest.raises(IntegrityError):
        GroupMember.objects.create(organization=org, group=group, student_profile=student)


def test_deleting_group_cascades_to_members_and_attendance():
    from attendance.models import Attendance
    from student.models import StudentProfile

    org = _make_org()
    group = _make_group(org)
    user = User.objects.create_user(organization=org, first_name="Sam", last_name="Student", password="pw123456", phone="+998900000098")
    student = StudentProfile.objects.create(organization=org, user=user, student_code="STU-2")
    member = GroupMember.objects.create(organization=org, group=group, student_profile=student)
    record = Attendance.objects.create(organization=org, group=group, student_profile=student, date="2026-09-01")

    group.delete()

    assert not GroupMember.objects.filter(id=member.id).exists()
    assert GroupMember.all_objects.get(id=member.id).deleted_at is not None
    assert not Attendance.objects.filter(id=record.id).exists()
    assert Attendance.all_objects.get(id=record.id).deleted_at is not None
