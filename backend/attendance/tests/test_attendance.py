import pytest
from django.db import IntegrityError

from attendance.models import Attendance
from course.models import Course
from foundation.models import Organization, User
from groups.models import Group
from student.models import StudentProfile
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


def _make_student(org, **kwargs):
    user = User.objects.create_user(
        organization=org, first_name="Sam", last_name="Student", password="pw123456",
        phone=f"+99891{StudentProfile.objects.count():07d}",
    )
    kwargs.setdefault("student_code", f"STU-{StudentProfile.objects.count() + 1}")
    return StudentProfile.objects.create(organization=org, user=user, **kwargs)


def test_attendance_unique_per_group_student_date():
    org = _make_org()
    group = _make_group(org)
    student = _make_student(org)
    Attendance.objects.create(organization=org, group=group, student_profile=student, date="2026-09-01")

    with pytest.raises(IntegrityError):
        Attendance.objects.create(organization=org, group=group, student_profile=student, date="2026-09-01")


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    group = _make_group(org)
    student = _make_student(org)
    record = Attendance.objects.create(organization=org, group=group, student_profile=student, date="2026-09-01")
    record_id = record.id

    record.delete()

    assert not Attendance.objects.filter(id=record_id).exists()
    assert Attendance.all_objects.filter(id=record_id).exists()
    assert Attendance.all_objects.get(id=record_id).deleted_at is not None
