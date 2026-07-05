-- ============================================================================
-- EduCore LMS - Foundation Module
-- Schema: foundation
-- Tables: organizations, branches, users, roles, permissions, 
--         user_roles, role_permissions, settings, audit_logs, files
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS foundation;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE foundation.organization_status_enum AS ENUM (
    'active', 'suspended', 'trial', 'cancelled'
);

CREATE TYPE foundation.user_status_enum AS ENUM (
    'active', 'inactive', 'suspended', 'pending'
);

CREATE TYPE foundation.gender_enum AS ENUM (
    'male', 'female', 'other', 'prefer_not_to_say'
);

CREATE TYPE foundation.file_category_enum AS ENUM (
    'avatar', 'document', 'material', 'homework', 'certificate', 'other'
);

CREATE TYPE foundation.audit_action_enum AS ENUM (
    'create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import'
);

CREATE TYPE foundation.setting_scope_enum AS ENUM (
    'platform', 'organization', 'branch', 'user'
);

-- ============================================================================
-- TABLE: organizations
-- Purpose: Root tenant entity. Every education center is an organization.
-- Why: Multi-tenant isolation anchor; all tenant data references this table.
-- ============================================================================

CREATE TABLE foundation.organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(100) NOT NULL,
    legal_name          VARCHAR(255),
    tax_id              VARCHAR(50),
    logo_url            TEXT,
    website             VARCHAR(255),
    email               VARCHAR(255) NOT NULL,
    phone               VARCHAR(20),
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(3) NOT NULL DEFAULT 'UZB',
    postal_code         VARCHAR(20),
    timezone            VARCHAR(50) NOT NULL DEFAULT 'Asia/Tashkent',
    locale              VARCHAR(10) NOT NULL DEFAULT 'uz',
    currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
    status              foundation.organization_status_enum NOT NULL DEFAULT 'trial',
    subscription_plan   VARCHAR(50) DEFAULT 'free',
    max_students        INTEGER DEFAULT 50,
    max_teachers        INTEGER DEFAULT 10,
    max_branches        INTEGER DEFAULT 1,
    trial_ends_at       TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    settings            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_organizations_slug UNIQUE (slug),
    CONSTRAINT chk_organizations_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_organizations_max_students CHECK (max_students > 0),
    CONSTRAINT chk_organizations_max_teachers CHECK (max_teachers > 0)
);

CREATE INDEX idx_organizations_status ON foundation.organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_country ON foundation.organizations(country) WHERE deleted_at IS NULL;

-- Sample Record:
-- id: 019145a1-b7e0-7000-8000-000000000001
-- name: 'Cambridge Learning Center'
-- slug: 'cambridge-lc'
-- email: 'info@cambridgelc.uz'
-- country: 'UZB'
-- status: 'active'
-- max_students: 500

-- ============================================================================
-- TABLE: branches
-- Purpose: Physical locations/campuses of an organization.
-- Why: Organizations can have multiple physical locations.
-- Relationships: belongs to organizations (N:1)
-- ============================================================================

CREATE TABLE foundation.branches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(20),
    phone               VARCHAR(20),
    email               VARCHAR(255),
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(3),
    postal_code         VARCHAR(20),
    latitude            DECIMAL(10, 8),
    longitude           DECIMAL(11, 8),
    timezone            VARCHAR(50),
    is_main             BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID,
    updated_by          UUID,

    CONSTRAINT uq_branches_org_code UNIQUE (organization_id, code),
    CONSTRAINT chk_branches_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_branches_longitude CHECK (longitude BETWEEN -180 AND 180)
);

CREATE INDEX idx_branches_org_id ON foundation.branches(organization_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: users
-- Purpose: All platform users (admins, teachers, students, parents).
-- Why: Central identity table for authentication and authorization.
-- Relationships: belongs to organization (N:1), has many user_roles (1:N)
-- ============================================================================

CREATE TABLE foundation.users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE SET NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    middle_name         VARCHAR(100),
    email               VARCHAR(255),
    phone               VARCHAR(20),
    password_hash       VARCHAR(255),
    avatar_url          TEXT,
    gender              foundation.gender_enum,
    date_of_birth       DATE,
    status              foundation.user_status_enum NOT NULL DEFAULT 'pending',
    language            VARCHAR(10) DEFAULT 'uz',
    last_login_at       TIMESTAMPTZ,
    email_verified_at   TIMESTAMPTZ,
    phone_verified_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID,
    updated_by          UUID,

    CONSTRAINT uq_users_org_email UNIQUE (organization_id, email),
    CONSTRAINT uq_users_org_phone UNIQUE (organization_id, phone),
    CONSTRAINT chk_users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CONSTRAINT chk_users_dob CHECK (date_of_birth < CURRENT_DATE)
);

CREATE INDEX idx_users_org_id ON foundation.users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_org_status ON foundation.users(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON foundation.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON foundation.users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_name ON foundation.users(organization_id, last_name, first_name) WHERE deleted_at IS NULL;

-- Sample Record:
-- id: 019145a1-b7e0-7000-8000-000000000010
-- organization_id: 019145a1-b7e0-7000-8000-000000000001
-- first_name: 'Aziz'
-- last_name: 'Karimov'
-- email: 'aziz@cambridgelc.uz'
-- phone: '+998901234567'
-- status: 'active'

-- ============================================================================
-- TABLE: permissions
-- Purpose: Granular actions that can be performed in the system.
-- Why: RBAC foundation - defines what actions exist system-wide.
-- Business Rule: Permissions are platform-level, not per-organization.
-- ============================================================================

CREATE TABLE foundation.permissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module              VARCHAR(50) NOT NULL,
    action              VARCHAR(50) NOT NULL,
    description         VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_permissions_module_action UNIQUE (module, action)
);

CREATE INDEX idx_permissions_module ON foundation.permissions(module);

-- Sample: module='students', action='create', description='Create new student profiles'

-- ============================================================================
-- TABLE: roles
-- Purpose: Named collections of permissions assigned to users.
-- Why: Groups permissions for easy assignment; supports org-custom roles.
-- Relationships: has many role_permissions (1:N), has many user_roles (1:N)
-- ============================================================================

CREATE TABLE foundation.roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) NOT NULL,
    description         VARCHAR(255),
    is_system           BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_roles_org_slug UNIQUE (organization_id, slug)
);

-- Note: organization_id is NULL for system-level roles (super_admin)
CREATE INDEX idx_roles_org_id ON foundation.roles(organization_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: user_roles (Bridge Table)
-- Purpose: Many-to-many relationship between users and roles.
-- Why: A user can have multiple roles; a role can be assigned to many users.
-- ============================================================================

CREATE TABLE foundation.user_roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES foundation.users(id) ON DELETE CASCADE,
    role_id             UUID NOT NULL REFERENCES foundation.roles(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    assigned_by         UUID REFERENCES foundation.users(id),
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id, organization_id)
);

CREATE INDEX idx_user_roles_user_id ON foundation.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON foundation.user_roles(role_id);
CREATE INDEX idx_user_roles_org_id ON foundation.user_roles(organization_id);

-- ============================================================================
-- TABLE: role_permissions (Bridge Table)
-- Purpose: Many-to-many relationship between roles and permissions.
-- Why: Defines what each role is allowed to do.
-- ============================================================================

CREATE TABLE foundation.role_permissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id             UUID NOT NULL REFERENCES foundation.roles(id) ON DELETE CASCADE,
    permission_id       UUID NOT NULL REFERENCES foundation.permissions(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_role_permissions_role_perm UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON foundation.role_permissions(role_id);
CREATE INDEX idx_role_permissions_perm_id ON foundation.role_permissions(permission_id);

-- ============================================================================
-- TABLE: settings
-- Purpose: Key-value configuration for platform, org, branch, or user level.
-- Why: Flexible configuration without schema changes; hierarchical override.
-- ============================================================================

CREATE TABLE foundation.settings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES foundation.users(id) ON DELETE CASCADE,
    scope               foundation.setting_scope_enum NOT NULL DEFAULT 'organization',
    key                 VARCHAR(255) NOT NULL,
    value               JSONB NOT NULL,
    description         VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_settings_scope_key UNIQUE (organization_id, branch_id, user_id, key)
);

CREATE INDEX idx_settings_org_key ON foundation.settings(organization_id, key);
CREATE INDEX idx_settings_scope ON foundation.settings(scope);

-- Sample: org_id=..., key='attendance.late_threshold_minutes', value='15'

-- ============================================================================
-- TABLE: audit_logs
-- Purpose: Immutable record of all significant actions in the system.
-- Why: Compliance, security investigation, change tracking.
-- Business Rules: Never updated or soft-deleted. Append-only.
-- ============================================================================

CREATE TABLE foundation.audit_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID REFERENCES foundation.organizations(id) ON DELETE SET NULL,
    user_id             UUID REFERENCES foundation.users(id) ON DELETE SET NULL,
    action              foundation.audit_action_enum NOT NULL,
    entity_type         VARCHAR(100) NOT NULL,
    entity_id           UUID,
    old_values          JSONB,
    new_values          JSONB,
    ip_address          INET,
    user_agent          TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()

    -- No updated_at or deleted_at: audit logs are immutable
);

CREATE INDEX idx_audit_logs_org_id ON foundation.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON foundation.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON foundation.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON foundation.audit_logs(action, created_at DESC);

-- Partitioning recommendation: PARTITION BY RANGE (created_at) monthly

-- ============================================================================
-- TABLE: files
-- Purpose: Centralized file/attachment registry for all modules.
-- Why: Deduplication, access control, consistent metadata tracking.
-- Relationships: belongs to user (uploader), polymorphic via entity_type/id
-- ============================================================================

CREATE TABLE foundation.files (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    uploaded_by         UUID NOT NULL REFERENCES foundation.users(id) ON DELETE SET NULL,
    category            foundation.file_category_enum NOT NULL DEFAULT 'other',
    original_name       VARCHAR(500) NOT NULL,
    stored_name         VARCHAR(500) NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    size_bytes          BIGINT NOT NULL,
    storage_path        TEXT NOT NULL,
    storage_provider    VARCHAR(50) NOT NULL DEFAULT 's3',
    entity_type         VARCHAR(100),
    entity_id           UUID,
    is_public           BOOLEAN NOT NULL DEFAULT FALSE,
    checksum            VARCHAR(64),
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_files_size CHECK (size_bytes > 0)
);

CREATE INDEX idx_files_org_id ON foundation.files(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_entity ON foundation.files(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_uploaded_by ON foundation.files(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_category ON foundation.files(organization_id, category) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION foundation.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON foundation.organizations
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON foundation.branches
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON foundation.users
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON foundation.roles
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON foundation.settings
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_files_updated_at BEFORE UPDATE ON foundation.files
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE foundation.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation.files ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for tenant isolation
CREATE POLICY tenant_isolation_users ON foundation.users
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation_branches ON foundation.branches
    USING (organization_id = current_setting('app.current_org_id')::UUID);
