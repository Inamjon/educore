"""Request-scoped organization context, read by tenant-scoped querysets.

Set by OrganizationContextMiddleware from the JWT's `org_id` claim (cheap,
DB-free decode) before the view runs. This is the *primary* multi-tenancy
enforcement layer; Postgres RLS (see migrations) is defense-in-depth on top
of it, not a replacement for it.
"""

from __future__ import annotations

from contextvars import ContextVar

_current_org_id: ContextVar[str | None] = ContextVar("current_org_id", default=None)
_current_user_id: ContextVar[str | None] = ContextVar("current_user_id", default=None)


def set_current_org_id(org_id: str | None) -> None:
    _current_org_id.set(str(org_id) if org_id else None)


def get_current_org_id() -> str | None:
    return _current_org_id.get()


def set_current_user_id(user_id: str | None) -> None:
    _current_user_id.set(str(user_id) if user_id else None)


def get_current_user_id() -> str | None:
    return _current_user_id.get()


def apply_org_context(org_id: str | None, user_id: str | None = None) -> None:
    """Sets both the Postgres session GUCs RLS policies read (`SET LOCAL
    app.current_org_id`/`app.current_user_id`) and the contextvars above —
    the same two-part write OrganizationContextMiddleware does per-request
    from the JWT's claims (see common/middleware.py, the primary caller).

    The other caller is payment_gateways' Payme/Click webhook views: those
    requests carry no JWT at all (the provider, not a logged-in user, is
    calling us), so there's no middleware-decoded org to inherit — the view
    resolves the organization itself (from the gateway account named in the
    URL) and calls this directly, inside its own `transaction.atomic()`
    block, before touching any RLS-protected table.
    """
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_org_id', %s, true)", [org_id])
        cursor.execute("SELECT set_config('app.current_user_id', %s, true)", [user_id or ""])
    set_current_org_id(org_id)
    set_current_user_id(user_id)
