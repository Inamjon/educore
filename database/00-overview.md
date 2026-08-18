# Mentorio LMS - Database Architecture Overview

## Platform Description

Mentorio is a multi-tenant, cloud-based Learning Management System (LMS) designed to serve thousands of education centers with millions of users. The platform provides comprehensive education management including student/teacher management, course scheduling, attendance tracking, homework/exams, finance, notifications, and AI-powered analytics.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-tenancy | Row-Level Isolation via `organization_id` | Cost-effective, simpler ops, RLS for security |
| Primary Keys | UUIDv7 | Time-ordered, globally unique, no sequence contention |
| Soft Deletes | `deleted_at` timestamp | Audit compliance, data recovery, referential safety |
| Normalization | 3NF | Data integrity, reduced redundancy |
| RBAC | Role → Permission mapping | Flexible, granular access control |
| Time Zones | All timestamps in UTC (`TIMESTAMPTZ`) | Consistent across global tenants |
| Encryption | Application-level for PII, TDE at rest | Defense in depth |
| Partitioning | By `organization_id` for large tables | Query performance at scale |

---

## Schema Organization

```
educore (database)
├── public          -- Shared/platform-level tables
├── foundation      -- Organizations, Users, Roles, Permissions, Files
├── auth            -- Authentication, Sessions, Tokens
├── student         -- Student profiles, parents, documents
├── teacher         -- Teacher profiles, specializations
├── course          -- Courses, categories, materials
├── "group"         -- Groups, members, transfers
├── schedule        -- Lessons, rooms, calendars
├── attendance      -- Attendance records
├── homework        -- Homework, submissions, grades
├── exam            -- Exams, questions, results
├── finance         -- Invoices, payments, payroll
├── notification    -- Notifications, SMS, email logs
├── report          -- Reports, statistics
└── ai              -- AI chat, recommendations, analytics
```

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case, plural | `student_profiles` |
| Columns | snake_case | `first_name` |
| Primary Keys | `id` | `id UUID` |
| Foreign Keys | `{table_singular}_id` | `organization_id` |
| Indexes | `idx_{table}_{columns}` | `idx_users_email` |
| Unique | `uq_{table}_{columns}` | `uq_users_email_org` |
| Check | `chk_{table}_{rule}` | `chk_users_age_positive` |
| Enums | `{domain}_{name}_enum` | `payment_status_enum` |

---

## Standard Columns (Every Table)

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at      TIMESTAMPTZ NULL
```

Where applicable:
```sql
created_by      UUID REFERENCES foundation.users(id),
updated_by      UUID REFERENCES foundation.users(id),
deleted_by      UUID REFERENCES foundation.users(id)
```

---

## Multi-Tenancy Strategy

- Every tenant-scoped table includes `organization_id UUID NOT NULL`
- Row-Level Security (RLS) policies enforce tenant isolation
- Composite indexes always lead with `organization_id`
- Application sets `current_setting('app.current_org_id')` per connection

---

## Key Relationships Summary

- Organization → Branches (1:N)
- Organization → Users (1:N)
- User → Roles (M:N via user_roles)
- Role → Permissions (M:N via role_permissions)
- Student → Groups (M:N via group_members)
- Group → Teachers (M:N via group_teachers)
- Group → Course (N:1)
- Lesson → Attendance (1:N)
- Student → Invoices (1:N)
- Homework → Submissions (1:N per student)

---

## PostgreSQL Extensions Required

| Extension | Purpose |
|-----------|---------|
| `pgcrypto` | UUID generation, encryption |
| `pg_trgm` | Fuzzy text search |
| `btree_gin` | Composite GIN indexes |
| `pg_stat_statements` | Query performance monitoring |
| `pgaudit` | Audit logging |

---

## Estimated Scale

| Metric | Target |
|--------|--------|
| Organizations | 10,000+ |
| Users per org | 100 - 50,000 |
| Total users | 10M+ |
| Concurrent connections | 10,000+ |
| Data retention | 7+ years |
| Availability | 99.9% |
