from __future__ import annotations

import hashlib
import secrets

from django.conf import settings
from django.utils import timezone

from auth_custom.models import Session

BYPASS_ALIAS = "auth_bypass_rls"


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def _device_label(user_agent: str) -> tuple[str, str]:
    """Very small heuristic, good enough for the "Active Sessions" UI's
    "Chrome on macOS" style labels — not a full user-agent parser."""
    ua = (user_agent or "").lower()
    if "iphone" in ua or "android" in ua and "mobile" in ua:
        device_type = "mobile"
    elif "ipad" in ua or "tablet" in ua:
        device_type = "tablet"
    else:
        device_type = "desktop"

    browser = next((b for b in ["edge", "chrome", "firefox", "safari"] if b in ua), "Browser").capitalize()
    os_name = next(
        (o for o in ["windows", "mac os", "android", "iphone", "linux"] if o in ua), "Unknown OS"
    ).title()
    return device_type, f"{browser} on {os_name}"


def create_session(*, user, organization, request) -> Session:
    """`token_hash` here is just an opaque unique identifier for the session
    row itself — NOT a hash of the (rotating) refresh token. Session
    validity is looked up by the JWT's `session_id` claim (this row's PK),
    never by matching a token string, so there's nothing meaningful to hash;
    a random value is enough to satisfy the DDL's NOT NULL UNIQUE column.
    """
    device_type, device_name = _device_label(request.META.get("HTTP_USER_AGENT", ""))
    now = timezone.now()
    return Session.objects.using(BYPASS_ALIAS).create(
        user=user,
        organization=organization,
        token_hash=hash_token(secrets.token_hex(32)),
        ip_address=request.META.get("REMOTE_ADDR"),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
        device_type=device_type,
        device_name=device_name,
        is_active=True,
        last_activity_at=now,
        expires_at=now + settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
    )


def revoke_session(session: Session, *, reason: str = "user_revoked") -> None:
    session.is_active = False
    session.ended_at = timezone.now()
    session.end_reason = reason
    session.save(update_fields=["is_active", "ended_at", "end_reason"])
