import pytest
from django.db import IntegrityError

from foundation.models import Organization, User
from teacher.models import TeacherProfile, TeacherSalary

pytestmark = pytest.mark.django_db


def _make_org(**kwargs):
    kwargs.setdefault("name", "Test Academy")
    kwargs.setdefault("slug", f"test-academy-{Organization.objects.count()}")
    kwargs.setdefault("email", "contact@test-academy.example")
    return Organization.objects.create(**kwargs)


def _make_teacher(org, **kwargs):
    user = User.objects.create_user(
        organization=org, first_name="Sarah", last_name="Connor", password="pw123456"
    )
    kwargs.setdefault("teacher_code", f"TCH-{TeacherProfile.objects.count() + 1}")
    return TeacherProfile.objects.create(organization=org, user=user, **kwargs)


def test_teacher_code_unique_per_organization():
    org = _make_org()
    _make_teacher(org, teacher_code="TCH-0001")

    other_user = User.objects.create_user(organization=org, first_name="Henry", last_name="Walsh", password="pw123456")
    with pytest.raises(IntegrityError):
        TeacherProfile.objects.create(organization=org, user=other_user, teacher_code="TCH-0001")


def test_experience_years_out_of_range_is_rejected():
    org = _make_org()
    user = User.objects.create_user(organization=org, first_name="Sarah", last_name="Connor", password="pw123456")
    with pytest.raises(IntegrityError):
        TeacherProfile.objects.create(organization=org, user=user, teacher_code="TCH-0002", experience_years=99)


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    profile = _make_teacher(org)
    profile_id = profile.id

    profile.delete()

    assert not TeacherProfile.objects.filter(id=profile_id).exists()
    assert TeacherProfile.all_objects.filter(id=profile_id).exists()
    assert TeacherProfile.all_objects.get(id=profile_id).deleted_at is not None


def test_salary_amount_cannot_be_negative():
    org = _make_org()
    profile = _make_teacher(org)
    with pytest.raises(IntegrityError):
        TeacherSalary.objects.create(
            organization=org,
            teacher_profile=profile,
            salary_type="fixed",
            amount=-100,
            effective_from="2026-01-01",
        )
