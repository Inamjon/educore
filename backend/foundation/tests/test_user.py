"""See finance/tests/test_finance.py's module docstring for why fixture
setup goes through the auth_bypass_rls alias under `transaction=True`.
"""

import uuid

import pytest
from django.db import transaction as db_transaction

from common.context import apply_org_context
from foundation.models import Organization, User

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


def test_login_id_and_member_code_are_generated_and_unique():
    org = _make_org()
    user1 = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Alice", last_name="Doe", password="s3cret-pass",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )
    user2 = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Bob", last_name="Roe", password="s3cret-pass",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )

    assert user1.login_id and user2.login_id
    assert user1.login_id != user2.login_id
    assert user1.member_code != user2.member_code
    assert user1.login_id != user1.member_code


def test_password_is_hashed_not_plaintext():
    org = _make_org()
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Alice", last_name="Doe", password="s3cret-pass",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )

    assert user.password != "s3cret-pass"
    assert user.check_password("s3cret-pass")
    assert not user.check_password("wrong-password")


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    user = User.objects.db_manager(BYPASS_ALIAS).create_user(
        organization=org, first_name="Alice", last_name="Doe", password="s3cret-pass",
        phone=f"+998901{uuid.uuid4().hex[:6]}",
    )
    user_id = user.id

    user.delete(using=BYPASS_ALIAS)

    assert not User.objects.using(BYPASS_ALIAS).filter(id=user_id).exists()  # excluded by default manager
    assert User.all_objects.using(BYPASS_ALIAS).filter(id=user_id).exists()  # row still physically present
    assert User.all_objects.using(BYPASS_ALIAS).get(id=user_id).deleted_at is not None


def test_phone_is_required():
    """foundation.User has no email field at all — phone is the sole
    contact/verification channel, so it can't be null."""
    org = _make_org()
    with pytest.raises(Exception):
        User.objects.db_manager(BYPASS_ALIAS).create_user(
            organization=org, first_name="No", last_name="Contact", password="s3cret-pass", phone=None,
        )
