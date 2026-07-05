-- ============================================================================
-- EduCore LMS - Homework Module
-- Schema: homework
-- Tables: homeworks, homework_attachments, homework_submissions,
--         homework_submission_files, homework_grades
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS homework;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE homework.homework_status_enum AS ENUM (
    'draft', 'published', 'closed', 'archived'
);

CREATE TYPE homework.submission_status_enum AS ENUM (
    'pending', 'submitted', 'late_submitted', 'returned', 'resubmitted'
);

CREATE TYPE homework.grade_status_enum AS ENUM (
    'pending', 'graded', 'returned_for_revision'
);

-- ============================================================================
-- TABLE: homeworks
-- Purpose: Homework assignments created by teachers for a group/lesson.
-- Why: Central entity for assignment management and tracking.
-- Relationships: belongs to group (N:1), optionally to lesson (N:1),
--                has many attachments (1:N), has many submissions (1:N)
-- ============================================================================

CREATE TABLE homework.homeworks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    group_id            UUID NOT NULL REFERENCES "group".groups(id) ON DELETE CASCADE,
    lesson_id           UUID REFERENCES schedule.lessons(id) ON DELETE SET NULL,
    teacher_profile_id  UUID NOT NULL REFERENCES teacher.teacher_profiles(id) ON DELETE RESTRICT,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    instructions        TEXT,
    status              homework.homework_status_enum NOT NULL DEFAULT 'draft',
    max_score           DECIMAL(5, 2) DEFAULT 100,
    passing_score       DECIMAL(5, 2),
    due_date            TIMESTAMPTZ NOT NULL,
    allow_late          BOOLEAN NOT NULL DEFAULT FALSE,
    late_penalty_percent DECIMAL(5, 2) DEFAULT 0,
    max_attempts        SMALLINT DEFAULT 1,
    is_mandatory        BOOLEAN NOT NULL DEFAULT TRUE,
    published_at        TIMESTAMPTZ,
    closed_at           TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),
    updated_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_homework_max_score CHECK (max_score > 0),
    CONSTRAINT chk_homework_passing CHECK (passing_score IS NULL OR (passing_score >= 0 AND passing_score <= max_score)),
    CONSTRAINT chk_homework_penalty CHECK (late_penalty_percent >= 0 AND late_penalty_percent <= 100),
    CONSTRAINT chk_homework_attempts CHECK (max_attempts >= 1)
);

CREATE INDEX idx_homeworks_group ON homework.homeworks(group_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_homeworks_lesson ON homework.homeworks(lesson_id) WHERE lesson_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_homeworks_teacher ON homework.homeworks(teacher_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_homeworks_org_status ON homework.homeworks(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_homeworks_due_date ON homework.homeworks(organization_id, due_date) WHERE deleted_at IS NULL AND status = 'published';

-- Sample Record:
-- title: 'Unit 3 - Grammar Exercises', group_id: ..., due_date: '2026-09-08T23:59:00Z',
-- max_score: 100, status: 'published', is_mandatory: true

-- ============================================================================
-- TABLE: homework_attachments
-- Purpose: Files/resources attached to a homework assignment by the teacher.
-- Why: Teachers provide reference materials, templates, or instructions as files.
-- Relationships: belongs to homework (N:1), references files table
-- ============================================================================

CREATE TABLE homework.homework_attachments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    homework_id         UUID NOT NULL REFERENCES homework.homeworks(id) ON DELETE CASCADE,
    file_id             UUID NOT NULL REFERENCES foundation.files(id) ON DELETE CASCADE,
    title               VARCHAR(255),
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_homework_attachments_file UNIQUE (homework_id, file_id)
);

CREATE INDEX idx_homework_attachments_hw ON homework.homework_attachments(homework_id);

-- ============================================================================
-- TABLE: homework_submissions
-- Purpose: A student's submission for a homework assignment.
-- Why: Track what each student submits, when, and how many attempts.
-- Business Rules: One active submission per student per homework (latest attempt).
-- Relationships: belongs to homework (N:1), belongs to student (N:1),
--                has many files (1:N), has one grade (1:1)
-- ============================================================================

CREATE TABLE homework.homework_submissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    homework_id         UUID NOT NULL REFERENCES homework.homeworks(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    status              homework.submission_status_enum NOT NULL DEFAULT 'pending',
    attempt_number      SMALLINT NOT NULL DEFAULT 1,
    content             TEXT,
    submitted_at        TIMESTAMPTZ,
    is_late             BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_submission_student_hw_attempt UNIQUE (homework_id, student_profile_id, attempt_number),
    CONSTRAINT chk_submission_attempt CHECK (attempt_number >= 1)
);

CREATE INDEX idx_homework_submissions_hw ON homework.homework_submissions(homework_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_homework_submissions_student ON homework.homework_submissions(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_homework_submissions_org ON homework.homework_submissions(organization_id, status) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: homework_submission_files
-- Purpose: Files uploaded by students as part of their submission.
-- Why: Students may attach multiple files per submission (essays, images, code).
-- Relationships: belongs to submission (N:1), references files table
-- ============================================================================

CREATE TABLE homework.homework_submission_files (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    submission_id       UUID NOT NULL REFERENCES homework.homework_submissions(id) ON DELETE CASCADE,
    file_id             UUID NOT NULL REFERENCES foundation.files(id) ON DELETE CASCADE,
    title               VARCHAR(255),
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_submission_files UNIQUE (submission_id, file_id)
);

CREATE INDEX idx_submission_files_submission ON homework.homework_submission_files(submission_id);

-- ============================================================================
-- TABLE: homework_grades
-- Purpose: Teacher's evaluation/grade for a homework submission.
-- Why: Track scoring, feedback, and grading workflow per submission.
-- Business Rules: One grade per submission. Can be returned for revision.
-- Relationships: belongs to submission (1:1)
-- ============================================================================

CREATE TABLE homework.homework_grades (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    submission_id       UUID NOT NULL REFERENCES homework.homework_submissions(id) ON DELETE CASCADE,
    graded_by           UUID NOT NULL REFERENCES foundation.users(id) ON DELETE RESTRICT,
    score               DECIMAL(5, 2) NOT NULL,
    max_score           DECIMAL(5, 2) NOT NULL,
    percentage          DECIMAL(5, 2) GENERATED ALWAYS AS (CASE WHEN max_score > 0 THEN (score / max_score) * 100 ELSE 0 END) STORED,
    status              homework.grade_status_enum NOT NULL DEFAULT 'graded',
    feedback            TEXT,
    graded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_homework_grades_submission UNIQUE (submission_id),
    CONSTRAINT chk_grade_score CHECK (score >= 0 AND score <= max_score),
    CONSTRAINT chk_grade_max CHECK (max_score > 0)
);

CREATE INDEX idx_homework_grades_submission ON homework.homework_grades(submission_id);
CREATE INDEX idx_homework_grades_org ON homework.homework_grades(organization_id);
CREATE INDEX idx_homework_grades_grader ON homework.homework_grades(graded_by);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_homeworks_updated_at BEFORE UPDATE ON homework.homeworks
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_homework_submissions_updated_at BEFORE UPDATE ON homework.homework_submissions
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_homework_grades_updated_at BEFORE UPDATE ON homework.homework_grades
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE homework.homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework.homework_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework.homework_submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework.homework_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON homework.homeworks
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON homework.homework_attachments
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON homework.homework_submissions
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON homework.homework_submission_files
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON homework.homework_grades
    USING (organization_id = current_setting('app.current_org_id')::UUID);
