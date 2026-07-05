-- ============================================================================
-- EduCore LMS - Teacher Management Module
-- Schema: teacher
-- Tables: teacher_profiles, teacher_salaries, teacher_availability,
--         teacher_specializations, teacher_documents
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS teacher;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE teacher.employment_type_enum AS ENUM (
    'full_time', 'part_time', 'contract', 'freelance', 'intern'
);

CREATE TYPE teacher.teacher_status_enum AS ENUM (
    'active', 'inactive', 'on_leave', 'terminated', 'pending'
);

CREATE TYPE teacher.salary_type_enum AS ENUM (
    'fixed', 'hourly', 'per_lesson', 'per_student', 'percentage'
);

CREATE TYPE teacher.day_of_week_enum AS ENUM (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);

CREATE TYPE teacher.document_type_enum AS ENUM (
    'passport', 'diploma', 'certificate', 'resume', 'contract', 'id_card', 'other'
);

-- ============================================================================
-- TABLE: teacher_profiles
-- Purpose: Extended teacher-specific data linked to the base users table.
-- Why: Separates teacher-specific fields (employment, salary) from universal user record.
-- Relationships: belongs to user (1:1), has many salaries, availability, specializations, documents
-- ============================================================================

CREATE TABLE teacher.teacher_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES foundation.users(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE SET NULL,
    teacher_code        VARCHAR(50) NOT NULL,
    status              teacher.teacher_status_enum NOT NULL DEFAULT 'pending',
    employment_type     teacher.employment_type_enum NOT NULL DEFAULT 'full_time',
    hire_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    termination_date    DATE,
    bio                 TEXT,
    experience_years    SMALLINT DEFAULT 0,
    education_degree    VARCHAR(100),
    university          VARCHAR(255),
    notes               TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),
    updated_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT uq_teacher_profiles_user UNIQUE (user_id),
    CONSTRAINT uq_teacher_profiles_org_code UNIQUE (organization_id, teacher_code),
    CONSTRAINT chk_teacher_termination CHECK (termination_date IS NULL OR termination_date >= hire_date),
    CONSTRAINT chk_teacher_experience CHECK (experience_years >= 0 AND experience_years <= 60)
);

CREATE INDEX idx_teacher_profiles_org ON teacher.teacher_profiles(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_teacher_profiles_status ON teacher.teacher_profiles(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_teacher_profiles_branch ON teacher.teacher_profiles(branch_id) WHERE deleted_at IS NULL;

-- Sample Record:
-- user_id: ..., teacher_code: 'TCH-001', status: 'active', employment_type: 'full_time', hire_date: '2025-01-15'

-- ============================================================================
-- TABLE: teacher_salaries
-- Purpose: Salary configuration and history for each teacher.
-- Why: Teachers can have different pay structures; track salary changes over time.
-- Business Rules: Only one active salary record per teacher at a time.
-- Relationships: belongs to teacher_profile (N:1)
-- ============================================================================

CREATE TABLE teacher.teacher_salaries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    teacher_profile_id  UUID NOT NULL REFERENCES teacher.teacher_profiles(id) ON DELETE CASCADE,
    salary_type         teacher.salary_type_enum NOT NULL,
    amount              DECIMAL(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
    percentage_value    DECIMAL(5, 2),
    effective_from      DATE NOT NULL,
    effective_to        DATE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_salary_amount CHECK (amount >= 0),
    CONSTRAINT chk_salary_percentage CHECK (percentage_value IS NULL OR (percentage_value >= 0 AND percentage_value <= 100)),
    CONSTRAINT chk_salary_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_teacher_salaries_teacher ON teacher.teacher_salaries(teacher_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_teacher_salaries_active ON teacher.teacher_salaries(teacher_profile_id, is_active) WHERE is_active = TRUE AND deleted_at IS NULL;

-- ============================================================================
-- TABLE: teacher_availability
-- Purpose: Weekly availability schedule for each teacher.
-- Why: Used for lesson scheduling to prevent conflicts and overwork.
-- Business Rules: No overlapping time slots on the same day for a teacher.
-- Relationships: belongs to teacher_profile (N:1)
-- ============================================================================

CREATE TABLE teacher.teacher_availability (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    teacher_profile_id  UUID NOT NULL REFERENCES teacher.teacher_profiles(id) ON DELETE CASCADE,
    day_of_week         teacher.day_of_week_enum NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    is_available        BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from      DATE,
    effective_to        DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_availability_times CHECK (end_time > start_time),
    CONSTRAINT chk_availability_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_teacher_availability_teacher ON teacher.teacher_availability(teacher_profile_id, day_of_week) WHERE deleted_at IS NULL;
CREATE INDEX idx_teacher_availability_org ON teacher.teacher_availability(organization_id) WHERE deleted_at IS NULL;

-- Sample: teacher_id: ..., day_of_week: 'monday', start_time: '09:00', end_time: '18:00', is_available: true

-- ============================================================================
-- TABLE: teacher_specializations
-- Purpose: Subjects/courses a teacher is qualified to teach.
-- Why: Match teachers to appropriate courses; display expertise on profiles.
-- Relationships: belongs to teacher_profile (N:1), references course categories
-- ============================================================================

CREATE TABLE teacher.teacher_specializations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    teacher_profile_id  UUID NOT NULL REFERENCES teacher.teacher_profiles(id) ON DELETE CASCADE,
    subject_name        VARCHAR(100) NOT NULL,
    proficiency_level   VARCHAR(50),
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    certificate_url     TEXT,
    years_experience    SMALLINT DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_teacher_spec_subject UNIQUE (teacher_profile_id, subject_name),
    CONSTRAINT chk_spec_experience CHECK (years_experience >= 0)
);

CREATE INDEX idx_teacher_specializations_teacher ON teacher.teacher_specializations(teacher_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_teacher_specializations_subject ON teacher.teacher_specializations(organization_id, subject_name) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: teacher_documents
-- Purpose: Official documents for teachers (contracts, diplomas, certificates).
-- Why: HR compliance, credential verification, document management.
-- Relationships: belongs to teacher_profile (N:1), references files table
-- ============================================================================

CREATE TABLE teacher.teacher_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    teacher_profile_id  UUID NOT NULL REFERENCES teacher.teacher_profiles(id) ON DELETE CASCADE,
    file_id             UUID REFERENCES foundation.files(id) ON DELETE SET NULL,
    document_type       teacher.document_type_enum NOT NULL,
    title               VARCHAR(255) NOT NULL,
    document_number     VARCHAR(100),
    issued_by           VARCHAR(255),
    issued_date         DATE,
    expiry_date         DATE,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by         UUID REFERENCES foundation.users(id),
    verified_at         TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_teacher_docs_expiry CHECK (expiry_date IS NULL OR expiry_date > issued_date)
);

CREATE INDEX idx_teacher_documents_teacher ON teacher.teacher_documents(teacher_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_teacher_documents_type ON teacher.teacher_documents(organization_id, document_type) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_teacher_profiles_updated_at BEFORE UPDATE ON teacher.teacher_profiles
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_teacher_salaries_updated_at BEFORE UPDATE ON teacher.teacher_salaries
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_teacher_availability_updated_at BEFORE UPDATE ON teacher.teacher_availability
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_teacher_specializations_updated_at BEFORE UPDATE ON teacher.teacher_specializations
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_teacher_documents_updated_at BEFORE UPDATE ON teacher.teacher_documents
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE teacher.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher.teacher_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher.teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher.teacher_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher.teacher_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON teacher.teacher_profiles
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON teacher.teacher_salaries
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON teacher.teacher_availability
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON teacher.teacher_specializations
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON teacher.teacher_documents
    USING (organization_id = current_setting('app.current_org_id')::UUID);
