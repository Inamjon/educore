import pytest

from foundation.models import Organization, User

pytestmark = pytest.mark.django_db


def _make_org(**kwargs):
    kwargs.setdefault("name", "Test Academy")
    kwargs.setdefault("slug", f"test-academy-{Organization.objects.count()}")
    kwargs.setdefault("email", "contact@test-academy.example")
    return Organization.objects.create(**kwargs)


def test_login_id_and_member_code_are_generated_and_unique():
    org = _make_org()
    user1 = User.objects.create_user(
        organization=org, first_name="Alice", last_name="Doe", password="s3cret-pass"
    )
    user2 = User.objects.create_user(
        organization=org, first_name="Bob", last_name="Roe", password="s3cret-pass"
    )

    assert user1.login_id and user2.login_id
    assert user1.login_id != user2.login_id
    assert user1.member_code != user2.member_code
    assert user1.login_id != user1.member_code


def test_password_is_hashed_not_plaintext():
    org = _make_org()
    user = User.objects.create_user(organization=org, first_name="Alice", last_name="Doe", password="s3cret-pass")

    assert user.password != "s3cret-pass"
    assert user.check_password("s3cret-pass")
    assert not user.check_password("wrong-password")


def test_soft_delete_never_hard_deletes():
    org = _make_org()
    user = User.objects.create_user(organization=org, first_name="Alice", last_name="Doe", password="s3cret-pass")
    user_id = user.id

    user.delete()

    assert not User.objects.filter(id=user_id).exists()  # excluded by default manager
    assert User.all_objects.filter(id=user_id).exists()  # row still physically present
    assert User.all_objects.get(id=user_id).deleted_at is not None


def test_email_and_phone_both_optional_but_not_both_null():
    org = _make_org()
    with pytest.raises(Exception):
        User.objects.create_user(
            organization=org, first_name="No", last_name="Contact", password="s3cret-pass",
            email=None, phone=None,
        )
