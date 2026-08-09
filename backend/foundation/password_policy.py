"""Password strength enforcement, driven by the platform Security setting's
`passwordPolicy` (basic/medium/strong — see foundation.services.get_platform_setting).
Hooked into the one place every password in this app actually gets set:
UserSerializer.create()/.update() (foundation/serializers.py) — covers an
admin creating a user, an admin changing another user's password, and a
self-service password change alike, since all three funnel through
UserViewSet -> that same serializer (see UserViewSet.perform_update's own
comment on this).
"""

import re

from rest_framework import serializers

from foundation.services import get_platform_setting

_POLICIES = {
    "basic": {
        "min_length": 8,
        "message": "Password must be at least 8 characters.",
    },
    "medium": {
        "min_length": 8,
        "message": "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.",
    },
    "strong": {
        "min_length": 12,
        "message": "Password must be at least 12 characters and include a special character.",
    },
}


def validate_password_policy(password: str) -> None:
    policy_name = get_platform_setting("security").get("passwordPolicy", "basic")
    policy = _POLICIES.get(policy_name, _POLICIES["basic"])

    if len(password) < policy["min_length"]:
        raise serializers.ValidationError({"password": policy["message"]})
    if policy_name == "medium" and not (
        re.search(r"[a-z]", password) and re.search(r"[A-Z]", password) and re.search(r"\d", password)
    ):
        raise serializers.ValidationError({"password": policy["message"]})
    if policy_name == "strong" and not re.search(r"[^A-Za-z0-9]", password):
        raise serializers.ValidationError({"password": policy["message"]})
