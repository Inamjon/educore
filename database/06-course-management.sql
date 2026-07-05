-- ============================================================================
-- EduCore LMS - Course Management Module
-- Schema: course
-- Tables: course_categories, course_levels, courses, course_materials
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS course;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE course.course_status_enum AS ENUM (
    'draft', 'active', 'archived', 'discontinued'
);

CREATE TYPE course.material_type_enum AS ENUM (
    'textbook', 'video', 'audio', 'document', 'presentation', 'link', 'other'
);

-- ============================================================================
-- TABLE: course_categories
-- Purpose: Hierarchical categorization of courses (e.g., Languages, IT, Math).
-- Why: Organize course catalog; support filtering and reporting by category.
-- Business Rules: Supports nested categories via parent_id (self-referencing).
-- Relationships: has many courses (1:N), self-referencing parent (tree)
-- ============================================================================

CREATE TABLE course.course_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    parent_id           UUID REFERENCES course.course_categories(id) ON DELETE SET NULL,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) NOT NULL,
    description         TEXT,
    icon                VARCHAR(50),
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_course_categories_org_slug UNIQUE (organization_id, slug)
);

CREATE INDEX idx_course_categories_org ON course.course_categories(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_course_categories_parent ON course.course_categories(parent_id) WHERE deleted_at IS NULL;

-- Sample: name='English Language', slug='english', parent_id=NULL (top-level)
-- Sample: name='IELTS Preparation', slug='ielts', parent_id=<english_id>

-- ============================================================================
-- TABLE: course_levels
-- Purpose: Proficiency/difficulty levels for courses (e.g., Beginner, A1, B2).
-- Why: Standard level definitions shared across courses within an org.
-- Relationships: has many courses (1:N)
-- ============================================================================

CREATE TABLE course.course_levels (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    name                VARCHAR(50) NOT NULL,
    slug                VARCHAR(50) NOT NULL,
    description         TEXT,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    color               VARCHAR(7),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_course_levels_org_slug UNIQUE (organization_id, slug)
);

CREATE INDEX idx_course_levels_org ON course.course_levels(organization_id) WHERE deleted_at IS NULL;

-- Sample: name='Beginner', slug='beginner', sort_order=1
-- Sample: name='Intermediate (B1)', slug='b1', sort_order=4

-- ============================================================================
-- TABLE: courses
-- Purpose: The core course/subject offerings of an organization.
-- Why: Central entity linking groups, schedules, materials, and enrollment.
-- Relationships: belongs to category (N:1), belongs to level (N:1),
--                has many groups (1:N), has many materials (1:N)
-- ============================================================================

CREATE TABLE course.courses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES course.course_categories(id) ON DELETE SET NULL,
    level_id            UUID REFERENCES course.course_levels(id) ON DELETE SET NULL,
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    slug                VARCHAR(100) NOT NULL,
    description         TEXT,
    short_description   VARCHAR(500),
    cover_image_url     TEXT,
    duration_hours      SMALLINT,
    duration_months     SMALLINT,
    total_lessons       SMALLINT,
    price               DECIMAL(12, 2),
    currency            VARCHAR(3) DEFAULT 'UZS',
    status              course.course_status_enum NOT NULL DEFAULT 'draft',
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    max_students        SMALLINT,
    min_students        SMALLINT DEFAULT 1,
    prerequisites       TEXT,
    syllabus            JSONB,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),
    updated_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT uq_courses_org_code UNIQUE (organization_id, code),
    CONSTRAINT uq_courses_org_slug UNIQUE (organization_id, slug),
    CONSTRAINT chk_courses_duration_hours CHECK (duration_hours IS NULL OR duration_hours > 0),
    CONSTRAINT chk_courses_duration_months CHECK (duration_months IS NULL OR duration_months > 0),
    CONSTRAINT chk_courses_price CHECK (price IS NULL OR price >= 0),
    CONSTRAINT chk_courses_students CHECK (min_students IS NULL OR max_students IS NULL OR max_students >= min_students)
);

CREATE INDEX idx_courses_org ON course.courses(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_category ON course.courses(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_level ON course.courses(level_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_status ON course.courses(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_code ON course.courses(organization_id, code) WHERE deleted_at IS NULL;

-- Sample Record:
-- name: 'General English - B1'
-- code: 'ENG-B1'
-- slug: 'general-english-b1'
-- duration_hours: 120
-- duration_months: 4
-- total_lessons: 48
-- price: 2500000.00
-- status: 'active'

-- ============================================================================
-- TABLE: course_materials
-- Purpose: Learning materials (textbooks, videos, docs) attached to a course.
-- Why: Centralized material management; shared across groups of same course.
-- Relationships: belongs to course (N:1), references files table
-- ============================================================================

CREATE TABLE course.course_materials (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    course_id           UUID NOT NULL REFERENCES course.courses(id) ON DELETE CASCADE,
    file_id             UUID REFERENCES foundation.files(id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    material_type       course.material_type_enum NOT NULL,
    url                 TEXT,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    is_required         BOOLEAN NOT NULL DEFAULT FALSE,
    is_visible          BOOLEAN NOT NULL DEFAULT TRUE,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_materials_source CHECK (file_id IS NOT NULL OR url IS NOT NULL)
);

CREATE INDEX idx_course_materials_course ON course.course_materials(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_course_materials_org ON course.course_materials(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_course_materials_type ON course.course_materials(course_id, material_type) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_course_categories_updated_at BEFORE UPDATE ON course.course_categories
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_course_levels_updated_at BEFORE UPDATE ON course.course_levels
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON course.courses
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_course_materials_updated_at BEFORE UPDATE ON course.course_materials
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE course.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE course.course_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE course.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course.course_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON course.course_categories
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON course.course_levels
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON course.courses
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON course.course_materials
    USING (organization_id = current_setting('app.current_org_id')::UUID);
