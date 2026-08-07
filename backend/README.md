# EduCore Backend

Django + DRF backend for EduCore. `foundation` and `auth_custom` (organizations,
branches, users, RBAC, JWT auth with real session tracking) shipped first as
Phase 0; `student`, `teacher`, `course`, `groups`, `attendance`, and `finance`
have since been added on top of it. Every other module (homework, exams,
notifications, reports/AI) is still a later phase; see
`C:\Users\qrina\.claude\plans\stateful-gliding-perlis.md` for the full
architecture plan this was built from.

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
-- Every app schema needs this — not just foundation/auth. Each new app
-- (course, groups, ...) adds its own CREATE SCHEMA IF NOT EXISTS in its
-- 0001_initial migration, but that migration runs as the superuser/owner;
-- it does NOT grant educore_app/educore_auth_bypass access to what it just
-- created — do that here, once per app, or every request against the new
-- app 500s with "permission denied for schema <name>" even though
-- `manage.py migrate` itself succeeded (RLS policies also don't help here:
-- this is plain schema/table privilege, evaluated before RLS ever runs).
CREATE ROLE educore_app LOGIN PASSWORD 'change-me';
GRANT USAGE ON SCHEMA foundation, auth, student, teacher, course, "group", attendance, finance TO educore_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA foundation, auth, student, teacher, course, "group", attendance, finance TO educore_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA foundation, auth, student, teacher, course, "group", attendance, finance
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO educore_app;

-- Used ONLY by the login endpoint's initial login_id -> user lookup, which
-- necessarily runs before any org context exists (see
-- common/middleware.py and auth_custom/views.py::LoginView). BYPASSRLS,
-- but still not a superuser — keep this role's blast radius as narrow as
-- the login/session/refresh-token code paths that actually use it.
CREATE ROLE educore_auth_bypass LOGIN PASSWORD 'change-me-too' BYPASSRLS;
GRANT USAGE ON SCHEMA foundation, auth, student, teacher, course, "group", attendance, finance TO educore_auth_bypass;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA foundation, auth, student, teacher, course, "group", attendance, finance TO educore_auth_bypass;
ALTER DEFAULT PRIVILEGES IN SCHEMA foundation, auth, student, teacher, course, "group", attendance, finance
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
uv run python manage.py create_super_admin --first-name Alex --last-name Rivera --phone +998901234567
uv run python manage.py runserver
```

`create_super_admin` prints the generated `login_id` (e.g. `EDU100001`) —
that, plus the password you're prompted for, is what the frontend's existing
"Login" field (not email — see below) authenticates with.

## Why no email/username login, and no email field at all

`foundation.users` has no `email` column — login is by `login_id`, never
email, and no code path ever read a user's email for anything else either
(no email verification flow is wired up; phone +
`auth_custom.PhoneVerification` is the one real contact/verification
channel). Reserving schema/index space for a field nothing uses isn't a
safety margin, so it was removed rather than left "just in case". Every
user instead gets a system-generated, globally-unique `login_id` at
creation (`foundation/managers.py`) — this is what the frontend's login page
already expects (`autoComplete="username"`, generic "Login" label, not
"Email"). A separate `member_code` is also generated per user, reserved for
the future Finance module's invoices — deliberately a different value from
`login_id` so login credentials and financial records never share an
identifier.

Organizations and Branches keep their own `email` field — that's org/branch
contact info, unrelated to how an individual user logs in.

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
frontend portal + this API is the real admin surface). No schedule, homework,
exam, finance, notification, or report/AI app yet — each is its own future
phase.
