import pytest
from django.db import IntegrityError

from course.models import Course
from foundation.models import Organization

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


def test_course_code_unique_per_organization():
    org = _make_org()
    _make_course(org, code="ENG-B1")

    with pytest.raises(IntegrityError):
        Course.objects.create(organization=org, name="Other", code="ENG-B1", category="Languages")


def test_negative_price_is_rejected():
    org = _make_org()
    with pytest.raises(IntegrityError):
        _make_course(org, price=-100)


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    course = _make_course(org)
    course_id = course.id

    course.delete()

    assert not Course.objects.filter(id=course_id).exists()
    assert Course.all_objects.filter(id=course_id).exists()
    assert Course.all_objects.get(id=course_id).deleted_at is not None
