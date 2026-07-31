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
