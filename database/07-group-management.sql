-- ============================================================================
-- EduCore LMS - Group Management Module
-- Schema: "group" (quoted - reserved word)
-- Tables: groups, group_members, group_teachers, group_transfers, waiting_lists
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS "group";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE "group".group_status_enum AS ENUM (
    'forming', 'active', 'completed', 'cancelled', 'archived'
);

CREATE TYPE "group".member_status_enum AS ENUM (
    'active', 'completed', 'dropped', 'transferred', 'suspended'
);

CREATE TYPE "group".transfer_status_enum AS ENUM (
    'pending', 'approved', 'rejected', 'cancelled'
);

CREATE TYPE "group".waitlist_status_enum AS ENUM (
    'waiting', 'offered', 'enrolled', 'expired', 'cancelled'
);

-- ============================================================================
-- TABLE: groups
-- Purpose: A class/group of students studying a specific course together.
-- Why: Core scheduling and enrollment unit; connects students, teachers, lessons.
-- Relationships: belongs to course (N:1), belongs to branch (N:1),
--                has many members (1:N), has many teachers (1:N)
-- ============================================================================

CREATE TABLE "group".groups (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE SET NULL,
    course_id           UUID NOT NULL REFERENCES course.courses(id) ON DELETE RESTRICT,
    name                VARCHAR(100) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    status              "group".group_status_enum NOT NULL DEFAULT 'forming',
    max_students        SMALLINT NOT NULL DEFAULT 15,
    min_students        SMALLINT NOT NULL DEFAULT 3,
    current_students    SMALLINT NOT NULL DEFAULT 0,
    start_date          DATE NOT NULL,
    end_date            DATE,
    total_lessons       SMALLINT,
    completed_lessons   SMALLINT NOT NULL DEFAULT 0,
    price               DECIMAL(12, 2),
    currency            VARCHAR(3) DEFAULT 'UZS',
    notes               TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),
    updated_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT uq_groups_org_code UNIQUE (organization_id, code),
    CONSTRAINT chk_groups_students CHECK (max_students >= min_students AND min_students > 0),
    CONSTRAINT chk_groups_current CHECK (current_students >= 0),
    CONSTRAINT chk_groups_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_groups_lessons CHECK (completed_lessons <= COALESCE(total_lessons, 32767))
);

CREATE INDEX idx_groups_org ON "group".groups(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_groups_course ON "group".groups(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_groups_branch ON "group".groups(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_groups_status ON "group".groups(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_groups_start_date ON "group".groups(organization_id, start_date) WHERE deleted_at IS NULL;

-- Sample Record:
-- name: 'English B1 - Morning', code: 'ENG-B1-M01', course_id: ..., 
-- max_students: 12, start_date: '2026-09-01', status: 'active'

-- ============================================================================
-- TABLE: group_members
-- Purpose: Students enrolled in a specific group (M:N bridge table).
-- Why: Tracks enrollment, completion, and student lifecycle within a group.
-- Relationships: belongs to group (N:1), belongs to student_profile (N:1)
-- ============================================================================

CREATE TABLE "group".group_members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    group_id            UUID NOT NULL REFERENCES "group".groups(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    status              "group".member_status_enum NOT NULL DEFAULT 'active',
    enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    dropped_at          TIMESTAMPTZ,
    drop_reason         TEXT,
    final_grade         DECIMAL(5, 2),
    attendance_rate     DECIMAL(5, 2),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT uq_group_members_student UNIQUE (group_id, student_profile_id),
    CONSTRAINT chk_group_members_grade CHECK (final_grade IS NULL OR (final_grade >= 0 AND final_grade <= 100)),
    CONSTRAINT chk_group_members_attendance CHECK (attendance_rate IS NULL OR (attendance_rate >= 0 AND attendance_rate <= 100))
);

CREATE INDEX idx_group_members_group ON "group".group_members(group_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_group_members_student ON "group".group_members(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_group_members_org_status ON "group".group_members(organization_id, status) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: group_teachers
-- Purpose: Teachers assigned to teach a group (M:N bridge table).
-- Why: A group can have multiple teachers; a teacher can teach multiple groups.
-- Business Rules: One teacher is marked as primary per group.
-- Relationships: belongs to group (N:1), belongs to teacher_profile (N:1)
-- ============================================================================

CREATE TABLE "group".group_teachers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    group_id            UUID NOT NULL REFERENCES "group".groups(id) ON DELETE CASCADE,
    teacher_profile_id  UUID NOT NULL REFERENCES teacher.teacher_profiles(id) ON DELETE CASCADE,
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at          TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    assigned_by         UUID REFERENCES foundation.users(id),

    CONSTRAINT uq_group_teachers_pair UNIQUE (group_id, teacher_profile_id)
);

CREATE INDEX idx_group_teachers_group ON "group".group_teachers(group_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_group_teachers_teacher ON "group".group_teachers(teacher_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_group_teachers_org ON "group".group_teachers(organization_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: group_transfers
-- Purpose: Track student transfers between groups.
-- Why: Students may need to move groups due to scheduling, level changes, etc.
-- Business Rules: Requires approval. Updates group_members status upon approval.
-- Relationships: belongs to student (N:1), references source and target groups
-- ============================================================================

CREATE TABLE "group".group_transfers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    from_group_id       UUID NOT NULL REFERENCES "group".groups(id) ON DELETE RESTRICT,
    to_group_id         UUID NOT NULL REFERENCES "group".groups(id) ON DELETE RESTRICT,
    status              "group".transfer_status_enum NOT NULL DEFAULT 'pending',
    reason              TEXT NOT NULL,
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at          TIMESTAMPTZ,
    decided_by          UUID REFERENCES foundation.users(id),
    effective_date      DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_transfer_different_groups CHECK (from_group_id != to_group_id)
);

CREATE INDEX idx_group_transfers_student ON "group".group_transfers(student_profile_id);
CREATE INDEX idx_group_transfers_org ON "group".group_transfers(organization_id, status);
CREATE INDEX idx_group_transfers_from ON "group".group_transfers(from_group_id);
CREATE INDEX idx_group_transfers_to ON "group".group_transfers(to_group_id);

-- ============================================================================
-- TABLE: waiting_lists
-- Purpose: Queue for students waiting to join a full group.
-- Why: Manage overflow demand; auto-enroll when spots open.
-- Business Rules: FIFO by position. Auto-expire after configurable period.
-- Relationships: belongs to group (N:1), belongs to student (N:1)
-- ============================================================================

CREATE TABLE "group".waiting_lists (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    group_id            UUID NOT NULL REFERENCES "group".groups(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    status              "group".waitlist_status_enum NOT NULL DEFAULT 'waiting',
    position            SMALLINT NOT NULL,
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    offered_at          TIMESTAMPTZ,
    offer_expires_at    TIMESTAMPTZ,
    enrolled_at         TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_waiting_list_student_group UNIQUE (group_id, student_profile_id),
    CONSTRAINT chk_waitlist_position CHECK (position > 0)
);

CREATE INDEX idx_waiting_lists_group ON "group".waiting_lists(group_id, status, position);
CREATE INDEX idx_waiting_lists_student ON "group".waiting_lists(student_profile_id, status);
CREATE INDEX idx_waiting_lists_org ON "group".waiting_lists(organization_id, status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_groups_updated_at BEFORE UPDATE ON "group".groups
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_group_members_updated_at BEFORE UPDATE ON "group".group_members
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_group_teachers_updated_at BEFORE UPDATE ON "group".group_teachers
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_group_transfers_updated_at BEFORE UPDATE ON "group".group_transfers
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_waiting_lists_updated_at BEFORE UPDATE ON "group".waiting_lists
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE "group".groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group".group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group".group_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group".group_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group".waiting_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "group".groups
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON "group".group_members
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON "group".group_teachers
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON "group".group_transfers
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON "group".waiting_lists
    USING (organization_id = current_setting('app.current_org_id')::UUID);
