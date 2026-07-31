from __future__ import annotations

from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class SessionValidatingJWTAuthentication(JWTAuthentication):
    """simplejwt handles the crypto; this adds the DB-backed check that makes
    the "Revoke session" feature (already built on the frontend's Profile
    pages) actually take effect immediately, rather than only at token
    expiry. Necessary consequence of tracking real sessions, not a flaw —
    see plan §3.
    """

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, validated_token = result

        from auth_custom.models import Session  # local import: avoids app-loading cycle

        session_id = validated_token.get("session_id")
        if not session_id:
            raise AuthenticationFailed("Token is missing session information.")

        session = (
            Session.objects.filter(
                id=session_id,
                is_active=True,
                expires_at__gt=timezone.now(),
            )
            .exclude(ended_at__isnull=False)
            .first()
        )
        if session is None:
            raise AuthenticationFailed("Session has been revoked or has expired.")

        Session.objects.filter(pk=session.pk).update(last_activity_at=timezone.now())

        return user, validated_token
