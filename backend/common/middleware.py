"""OrganizationContextMiddleware.

DRF authentication runs *inside* view dispatch, after Django's middleware
chain has already called get_response() — so this middleware can't wait for
`request.user` to be resolved. Instead it does its own cheap, DB-free JWT
claim decode (signature + expiry only, via simplejwt's UntypedToken) purely
to read the `org_id` and `user_id` custom claims, then:

  1. wraps the remainder of the request in transaction.atomic() and issues
     `SET LOCAL app.current_org_id = <org_id>` and `app.current_user_id =
     <user_id>` — Postgres RLS policies read these via `current_setting(...,
     true)`. Always `SET LOCAL`, never plain `SET`: this is what keeps things
     compatible with PgBouncer transaction-mode pooling later. `current_user_id`
     exists specifically so `foundation.is_platform_user()` can let
     super-admin (system-role) users see across every organization instead of
     being scoped to just one — see migrations/0004_rls.py.
  2. sets the same values in contextvars for the app-layer queryset
     filtering that custom managers use as the primary tenancy control.

The *real*, DB-backed user/session validation (checking auth.sessions is
still active, so the "Revoke" button takes effect immediately) happens
separately, later, in common.authentication.SessionValidatingJWTAuthentication
— that class trusts this middleware to have already set the org context.

Endpoints with no token at all (login, token refresh, health checks) simply
pass through with no org context set; RLS's null-safe `current_setting(...,
true)` returns NULL for them rather than erroring.
"""

from __future__ import annotations

from django.db import transaction
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken

from common.context import apply_org_context, set_current_org_id, set_current_user_id
from common.cookies import ACCESS_COOKIE


class OrganizationContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        org_id, user_id = self._claims_from_request(request)

        if org_id is None:
            set_current_org_id(None)
            set_current_user_id(None)
            return self.get_response(request)

        with transaction.atomic():
            apply_org_context(org_id, user_id)
            return self.get_response(request)

    @staticmethod
    def _claims_from_request(request) -> tuple[str | None, str | None]:
        # The frontend never holds the raw JWT (httpOnly cookie only), so the
        # access token normally arrives via the `access_token` cookie —
        # checked first, with the Authorization header kept as a fallback
        # for tooling/tests that authenticate the old way. Must match
        # common.authentication.SessionValidatingJWTAuthentication's lookup
        # order, since that's what actually authenticates the request later.
        raw_token = request.COOKIES.get(ACCESS_COOKIE)
        if raw_token is None:
            auth_header = request.META.get("HTTP_AUTHORIZATION", "")
            if not auth_header.startswith("Bearer "):
                return None, None
            raw_token = auth_header.removeprefix("Bearer ").strip()
        try:
            token = UntypedToken(raw_token)  # signature + exp check only, no DB hit
        except (InvalidToken, TokenError):
            return None, None
        return token.get("org_id"), token.get("user_id")
