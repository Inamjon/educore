"""See finance/tests/test_finance.py's module docstring for why fixture
setup goes through the auth_bypass_rls alias under `transaction=True`.
"""

from datetime import date

import uuid

import pytest
from django.db import IntegrityError
from django.db import transaction as db_transaction

from common.context import apply_org_context
from foundation.models import Organization, User
from student.models import StudentParent, StudentProfile

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


def _make_student(org, **kwargs):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Alice", last_name="Doe", password="pw123456",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )
    kwargs.setdefault("student_code", f"STU-{uuid.uuid4().hex[:6]}")
    return StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=user, **kwargs)


def test_student_code_unique_per_organization():
    org = _make_org()
    _make_student(org, student_code="STU-0001")

    other_user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Bob", last_name="Roe", password="pw123456",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )
    with pytest.raises(IntegrityError):
        StudentProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=other_user, student_code="STU-0001")


def test_graduation_date_before_enrollment_date_is_rejected():
    org = _make_org()
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Alice", last_name="Doe", password="pw123456",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )
    with pytest.raises(IntegrityError):
        StudentProfile.objects.using(BYPASS_ALIAS).create(
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

    profile.delete(using=BYPASS_ALIAS)

    assert not StudentProfile.objects.using(BYPASS_ALIAS).filter(id=profile_id).exists()
    assert StudentProfile.all_objects.using(BYPASS_ALIAS).filter(id=profile_id).exists()
    assert StudentProfile.all_objects.using(BYPASS_ALIAS).get(id=profile_id).deleted_at is not None


def test_parent_requires_phone_or_email():
    org = _make_org()
    profile = _make_student(org)
    with pytest.raises(IntegrityError):
        StudentParent.objects.using(BYPASS_ALIAS).create(
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
    parent = StudentParent.objects.using(BYPASS_ALIAS).create(
        organization=org,
        student_profile=profile,
        relation="mother",
        first_name="Mary",
        last_name="Doe",
        email="mary@example.com",
    )
    assert parent.phone is None
