"""See finance/tests/test_finance.py's module docstring for why fixture
setup goes through the auth_bypass_rls alias under `transaction=True`.
"""

import uuid

import pytest
from django.db import IntegrityError
from django.db import transaction as db_transaction

from common.context import apply_org_context
from foundation.models import Organization, User
from teacher.models import TeacherProfile, TeacherSalary

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


def _make_teacher(org, **kwargs):
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Sarah", last_name="Connor", password="pw123456",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )
    kwargs.setdefault("teacher_code", f"TCH-{uuid.uuid4().hex[:6]}")
    return TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=user, **kwargs)


def test_teacher_code_unique_per_organization():
    org = _make_org()
    _make_teacher(org, teacher_code="TCH-0001")

    other_user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Henry", last_name="Walsh", password="pw123456",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )
    with pytest.raises(IntegrityError):
        TeacherProfile.objects.using(BYPASS_ALIAS).create(organization=org, user=other_user, teacher_code="TCH-0001")


def test_experience_years_out_of_range_is_rejected():
    org = _make_org()
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Sarah", last_name="Connor", password="pw123456",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )
    with pytest.raises(IntegrityError):
        TeacherProfile.objects.using(BYPASS_ALIAS).create(
            organization=org, user=user, teacher_code="TCH-0002", experience_years=99
        )


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    profile = _make_teacher(org)
    profile_id = profile.id

    profile.delete(using=BYPASS_ALIAS)

    assert not TeacherProfile.objects.using(BYPASS_ALIAS).filter(id=profile_id).exists()
    assert TeacherProfile.all_objects.using(BYPASS_ALIAS).filter(id=profile_id).exists()
    assert TeacherProfile.all_objects.using(BYPASS_ALIAS).get(id=profile_id).deleted_at is not None


def test_salary_amount_cannot_be_negative():
    org = _make_org()
    profile = _make_teacher(org)
    with pytest.raises(IntegrityError):
        TeacherSalary.objects.using(BYPASS_ALIAS).create(
            organization=org,
            teacher_profile=profile,
            salary_type="fixed",
            amount=-100,
            effective_from="2026-01-01",
        )
