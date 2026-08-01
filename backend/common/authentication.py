from __future__ import annotations

from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from common.cookies import ACCESS_COOKIE


class SessionValidatingJWTAuthentication(JWTAuthentication):
    """simplejwt handles the crypto; this adds the DB-backed check that makes
    the "Revoke session" feature (already built on the frontend's Profile
    pages) actually take effect immediately, rather than only at token
    expiry. Necessary consequence of tracking real sessions, not a flaw —
    see plan §3.

    The frontend never holds the raw JWT (httpOnly cookie only), so the
    access token normally arrives via the `access_token` cookie rather than
    an Authorization header — checked first, with the header kept as a
    fallback for tooling/tests that authenticate the old way.
    """

    def authenticate(self, request):
        raw_token = request.COOKIES.get(ACCESS_COOKIE)
        if raw_token is None:
            header = self.get_header(request)
            raw_token = self.get_raw_token(header) if header is not None else None
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

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
