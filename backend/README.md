# EduCore Backend — Phase 0 (Foundation & Auth)

Django + DRF backend for EduCore. Phase 0 covers only the `foundation` and
`auth_custom` apps — organizations, branches, users, RBAC, and JWT auth with
real session tracking. Every other module (students, teachers, courses,
attendance, homework, exams, finance, notifications, reports/AI) is a later
phase; see `C:\Users\qrina\.claude\plans\stateful-gliding-perlis.md` for the
full architecture plan this was built from.

## Prerequisites

- PostgreSQL 14+ (not installed in the environment this was built in — you
  need to provide one, locally or remote)
- Python 3.11+ and [`uv`](https://docs.astral.sh/uv/)

## One-time Postgres role setup

The multi-tenancy design uses Row-Level Security with **two distinct,
non-superuser roles** — the app deliberately never connects as the table
owner (owners silently bypass `FORCE ROW LEVEL SECURITY`, which would make
the whole RLS layer a no-op):

```sql
-- Run these as a superuser, once, against the target database.
CREATE DATABASE educore;
\c educore

-- Owns all tables/schemas — this is whichever role runs `manage.py migrate`.
-- Typically your existing superuser/admin role is fine for this.

-- Regular app connection — NOT the owner, NOT superuser, no BYPASSRLS.
-- This is what every normal request uses; RLS applies to it in full.
CREATE ROLE educore_app LOGIN PASSWORD 'change-me';
GRANT USAGE ON SCHEMA foundation, auth TO educore_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA foundation, auth TO educore_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA foundation, auth
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO educore_app;

-- Used ONLY by the login endpoint's initial login_id -> user lookup, which
-- necessarily runs before any org context exists (see
-- common/middleware.py and auth_custom/views.py::LoginView). BYPASSRLS,
-- but still not a superuser — keep this role's blast radius as narrow as
-- the login/session/refresh-token code paths that actually use it.
CREATE ROLE educore_auth_bypass LOGIN PASSWORD 'change-me-too' BYPASSRLS;
GRANT USAGE ON SCHEMA foundation, auth TO educore_auth_bypass;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA foundation, auth TO educore_auth_bypass;
ALTER DEFAULT PRIVILEGES IN SCHEMA foundation, auth
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO educore_auth_bypass;
```

Run `manage.py migrate` as whatever role owns the database (a superuser is
simplest for local dev) — **not** as `educore_app` or `educore_auth_bypass`,
both of which lack the privileges to create schemas/extensions/functions.

## Setup

```bash
cd backend
uv sync
cp .env.example .env   # fill in DB credentials for the two roles above
uv run python manage.py migrate
uv run python manage.py create_super_admin --first-name Alex --last-name Rivera
uv run python manage.py runserver
```

`create_super_admin` prints the generated `login_id` (e.g. `EDU100001`) —
that, plus the password you're prompted for, is what the frontend's existing
"Login" field (not email — see below) authenticates with.

## Why no email/username login

`foundation.users` allows the same email across different organizations
(a teacher at two centers, for example), which makes email unusable as a
login identifier without an organization picker the frontend doesn't have.
Every user instead gets a system-generated, globally-unique `login_id` at
creation (`foundation/managers.py`) — this is what the frontend's login page
already expects (`autoComplete="username"`, generic "Login" label, not
"Email" — no frontend changes needed for this). A separate `member_code` is
also generated per user, reserved for the future Finance module's invoices
— deliberately a different value from `login_id` so login credentials and
financial records never share an identifier.

## Verifying the setup

1. `POST /api/v1/auth/login/` with `{"login_id": "EDU100001", "password": "..."}`
   → should return `{"success": true, "data": {"access": "...", "refresh": "...", "user": {...}}}`.
2. `GET /api/v1/organizations/` with `Authorization: Bearer <access>` → should
   list organizations, scoped by RLS to the caller's own org unless they
   hold a system-level role (super_admin), in which case they see all of them.
3. `GET /api/v1/auth/sessions/` → the session created at step 1 should
   appear with `"current": true`.
4. `POST /api/v1/auth/sessions/<id>/revoke/` on a *different* session →
   `200`; the next authenticated request using that session's token should
   then get `401` immediately (not just at token expiry) — this is what
   powers the "Revoke" button already built on the Teacher/Super-Admin
   Profile pages' Active Sessions UI.
5. `uv run pytest` — unit tests for login_id/member_code generation,
   soft-delete behavior, RBAC permission checks, and the login flow
   end-to-end (requires both Postgres roles above to exist on the test
   server too).

## What's deliberately NOT here yet

No `django.contrib.admin` (the schema has no `is_staff`/`is_superuser` —
"super admin" is an RBAC role assignment, not a user flag; the Super-Admin
frontend portal + this API is the real admin surface). No student, teacher,
course, group, schedule, attendance, homework, exam, finance, notification,
or report/AI app — each is its own future phase once this foundation is
verified working end-to-end against a real Postgres instance.
