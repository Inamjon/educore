from datetime import date, timedelta

import pytest
from django.db import IntegrityError

from foundation.models import Organization, User
from student.models import StudentParent, StudentProfile

pytestmark = pytest.mark.django_db


def _make_org(**kwargs):
    kwargs.setdefault("name", "Test Academy")
    kwargs.setdefault("slug", f"test-academy-{Organization.objects.count()}")
    kwargs.setdefault("email", "contact@test-academy.example")
    return Organization.objects.create(**kwargs)


def _make_student(org, **kwargs):
    user = User.objects.create_user(
        organization=org, first_name="Alice", last_name="Doe", password="pw123456"
    )
    kwargs.setdefault("student_code", f"STU-{StudentProfile.objects.count() + 1}")
    return StudentProfile.objects.create(organization=org, user=user, **kwargs)


def test_student_code_unique_per_organization():
    org = _make_org()
    _make_student(org, student_code="STU-0001")

    other_user = User.objects.create_user(organization=org, first_name="Bob", last_name="Roe", password="pw123456")
    with pytest.raises(IntegrityError):
        StudentProfile.objects.create(organization=org, user=other_user, student_code="STU-0001")


def test_graduation_date_before_enrollment_date_is_rejected():
    org = _make_org()
    user = User.objects.create_user(organization=org, first_name="Alice", last_name="Doe", password="pw123456")
    with pytest.raises(IntegrityError):
        StudentProfile.objects.create(
            organization=org,
            user=user,
            student_code="STU-0002",
            enrollment_date=date(2026, 9, 1),
            graduation_date=date(2026, 1, 1),
        )


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    profile = _make_student(org)
    profile_id = profile.id

    profile.delete()

    assert not StudentProfile.objects.filter(id=profile_id).exists()
    assert StudentProfile.all_objects.filter(id=profile_id).exists()
    assert StudentProfile.all_objects.get(id=profile_id).deleted_at is not None


def test_parent_requires_phone_or_email():
    org = _make_org()
    profile = _make_student(org)
    with pytest.raises(IntegrityError):
        StudentParent.objects.create(
            organization=org,
            student_profile=profile,
            relation="mother",
            first_name="Mary",
            last_name="Doe",
            phone=None,
            email=None,
        )


def test_parent_with_only_email_is_valid():
    org = _make_org()
    profile = _make_student(org)
    parent = StudentParent.objects.create(
        organization=org,
        student_profile=profile,
        relation="mother",
        first_name="Mary",
        last_name="Doe",
        email="mary@example.com",
    )
    assert parent.phone is None
