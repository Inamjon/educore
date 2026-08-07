"""See finance/tests/test_finance.py's module docstring for why fixture
setup goes through the auth_bypass_rls alias under `transaction=True`.
"""

import uuid

import pytest
from django.db import IntegrityError
from django.db import transaction as db_transaction

from common.context import apply_org_context
from course.models import Course
from foundation.models import Organization

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


def test_course_code_unique_per_organization():
    org = _make_org()
    _make_course(org, code="ENG-B1")

    with pytest.raises(IntegrityError):
        Course.objects.using(BYPASS_ALIAS).create(organization=org, name="Other", code="ENG-B1", category="Languages")


def test_negative_price_is_rejected():
    org = _make_org()
    with pytest.raises(IntegrityError):
        _make_course(org, price=-100)


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    course = _make_course(org)
    course_id = course.id

    course.delete(using=BYPASS_ALIAS)

    assert not Course.objects.using(BYPASS_ALIAS).filter(id=course_id).exists()
    assert Course.all_objects.using(BYPASS_ALIAS).filter(id=course_id).exists()
    assert Course.all_objects.using(BYPASS_ALIAS).get(id=course_id).deleted_at is not None
