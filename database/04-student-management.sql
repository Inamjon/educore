-- ============================================================================
-- EduCore LMS - Student Management Module
-- Schema: student
-- Tables: student_profiles, student_parents, emergency_contacts,
--         student_documents, student_status_history
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS student;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE student.student_status_enum AS ENUM (
    'active', 'inactive', 'graduated', 'expelled', 'transferred', 'on_leave', 'pending'
);

CREATE TYPE student.parent_relation_enum AS ENUM (
    'father', 'mother', 'guardian', 'sibling', 'grandparent', 'other'
);

CREATE TYPE student.document_type_enum AS ENUM (
    'passport', 'birth_certificate', 'id_card', 'transcript', 'medical_record',
    'photo', 'contract', 'other'
);

-- ============================================================================
-- TABLE: student_profiles
-- Purpose: Extended student-specific data linked to the base users table.
-- Why: Separates student-specific fields from the universal user record.
-- Relationships: belongs to user (1:1), has many parents, contacts, documents
-- ============================================================================

CREATE TABLE student.student_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES foundation.users(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE SET NULL,
    student_code        VARCHAR(50) NOT NULL,
    status              student.student_status_enum NOT NULL DEFAULT 'pending',
    enrollment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    graduation_date     DATE,
    education_level     VARCHAR(100),
    school_name         VARCHAR(255),
    previous_institution VARCHAR(255),
    medical_notes       TEXT,
    allergies           TEXT,
    blood_type          VARCHAR(5),
    notes               TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),
    updated_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT uq_student_profiles_user UNIQUE (user_id),
    CONSTRAINT uq_student_profiles_org_code UNIQUE (organization_id, student_code),
    CONSTRAINT chk_student_graduation CHECK (graduation_date IS NULL OR graduation_date >= enrollment_date)
);

CREATE INDEX idx_student_profiles_org ON student.student_profiles(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_profiles_status ON student.student_profiles(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_profiles_branch ON student.student_profiles(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_profiles_code ON student.student_profiles(organization_id, student_code) WHERE deleted_at IS NULL;

-- Sample Record:
-- user_id: ..., student_code: 'STU-2026-0001', status: 'active', enrollment_date: '2026-09-01'

-- ============================================================================
-- TABLE: student_parents
-- Purpose: Parent/guardian information linked to students.
-- Why: Parents need portal access and contact for communications.
-- Relationships: belongs to student_profile (N:1), optionally linked to users table
-- ============================================================================

CREATE TABLE student.student_parents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES foundation.users(id) ON DELETE SET NULL,
    relation            student.parent_relation_enum NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    phone               VARCHAR(20),
    email               VARCHAR(255),
    workplace           VARCHAR(255),
    occupation          VARCHAR(100),
    is_primary_contact  BOOLEAN NOT NULL DEFAULT FALSE,
    can_pickup          BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_parent_contact CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX idx_student_parents_student ON student.student_parents(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_parents_org ON student.student_parents(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_parents_user ON student.student_parents(user_id) WHERE user_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- TABLE: emergency_contacts
-- Purpose: Emergency contact persons for students (distinct from parents).
-- Why: Safety compliance; contacts for medical/security emergencies.
-- Relationships: belongs to student_profile (N:1)
-- ============================================================================

CREATE TABLE student.emergency_contacts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    full_name           VARCHAR(200) NOT NULL,
    relationship        VARCHAR(50) NOT NULL,
    phone_primary       VARCHAR(20) NOT NULL,
    phone_secondary     VARCHAR(20),
    address             TEXT,
    priority            SMALLINT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_emergency_priority CHECK (priority BETWEEN 1 AND 5)
);

CREATE INDEX idx_emergency_contacts_student ON student.emergency_contacts(student_profile_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: student_documents
-- Purpose: Official documents uploaded for a student (passports, contracts, etc.)
-- Why: Document management and compliance tracking per student.
-- Relationships: belongs to student_profile (N:1), references files table
-- ============================================================================

CREATE TABLE student.student_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    file_id             UUID REFERENCES foundation.files(id) ON DELETE SET NULL,
    document_type       student.document_type_enum NOT NULL,
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

    CONSTRAINT chk_student_docs_expiry CHECK (expiry_date IS NULL OR expiry_date > issued_date)
);

CREATE INDEX idx_student_documents_student ON student.student_documents(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_documents_type ON student.student_documents(organization_id, document_type) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: student_status_history
-- Purpose: Track all status transitions of a student over time.
-- Why: Audit trail for enrollment lifecycle; analytics on retention.
-- Business Rules: Append-only. Each status change creates a new record.
-- Relationships: belongs to student_profile (N:1)
-- ============================================================================

CREATE TABLE student.student_status_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    previous_status     student.student_status_enum,
    new_status          student.student_status_enum NOT NULL,
    reason              TEXT,
    effective_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    changed_by          UUID REFERENCES foundation.users(id),
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()

    -- Immutable: no updated_at or deleted_at
);

CREATE INDEX idx_student_status_history_student ON student.student_status_history(student_profile_id, created_at DESC);
CREATE INDEX idx_student_status_history_org ON student.student_status_history(organization_id, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_student_profiles_updated_at BEFORE UPDATE ON student.student_profiles
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_student_parents_updated_at BEFORE UPDATE ON student.student_parents
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_emergency_contacts_updated_at BEFORE UPDATE ON student.emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_student_documents_updated_at BEFORE UPDATE ON student.student_documents
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE student.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student.student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student.student_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON student.student_profiles
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON student.student_parents
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON student.emergency_contacts
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON student.student_documents
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON student.student_status_history
    USING (organization_id = current_setting('app.current_org_id')::UUID);
