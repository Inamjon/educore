-- ============================================================================
-- EduCore LMS - Exams Module
-- Schema: exam
-- Tables: exam_types, exams, exam_questions, exam_results, certificates
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS exam;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE exam.exam_status_enum AS ENUM (
    'draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'archived'
);

CREATE TYPE exam.question_type_enum AS ENUM (
    'multiple_choice', 'single_choice', 'true_false', 'short_answer',
    'essay', 'fill_blank', 'matching', 'ordering'
);

CREATE TYPE exam.difficulty_enum AS ENUM (
    'easy', 'medium', 'hard', 'expert'
);

CREATE TYPE exam.result_status_enum AS ENUM (
    'pending', 'in_progress', 'submitted', 'graded', 'reviewed'
);

CREATE TYPE exam.certificate_status_enum AS ENUM (
    'issued', 'revoked', 'expired'
);

-- ============================================================================
-- TABLE: exam_types
-- Purpose: Categories/types of exams (midterm, final, placement, mock, etc.)
-- Why: Standardize exam classification; different types may have different rules.
-- Relationships: has many exams (1:N)
-- ============================================================================

CREATE TABLE exam.exam_types (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) NOT NULL,
    description         TEXT,
    weight_percentage   DECIMAL(5, 2),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_exam_types_org_slug UNIQUE (organization_id, slug),
    CONSTRAINT chk_exam_types_weight CHECK (weight_percentage IS NULL OR (weight_percentage >= 0 AND weight_percentage <= 100))
);

CREATE INDEX idx_exam_types_org ON exam.exam_types(organization_id) WHERE deleted_at IS NULL;

-- Sample: name='Midterm Exam', slug='midterm', weight_percentage=30
-- Sample: name='Final Exam', slug='final', weight_percentage=50

-- ============================================================================
-- TABLE: exams
-- Purpose: A specific exam instance for a group or course.
-- Why: Central entity for exam scheduling, configuration, and result collection.
-- Business Rules: Exams have a time window. Can be retaken if configured.
-- Relationships: belongs to exam_type (N:1), belongs to group (N:1),
--                has many questions (1:N), has many results (1:N)
-- ============================================================================

CREATE TABLE exam.exams (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    exam_type_id        UUID NOT NULL REFERENCES exam.exam_types(id) ON DELETE RESTRICT,
    group_id            UUID REFERENCES "group".groups(id) ON DELETE SET NULL,
    course_id           UUID REFERENCES course.courses(id) ON DELETE SET NULL,
    created_by_teacher  UUID REFERENCES teacher.teacher_profiles(id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    instructions        TEXT,
    status              exam.exam_status_enum NOT NULL DEFAULT 'draft',
    total_marks         DECIMAL(6, 2) NOT NULL DEFAULT 100,
    passing_marks       DECIMAL(6, 2) NOT NULL DEFAULT 60,
    duration_minutes    SMALLINT NOT NULL,
    start_datetime      TIMESTAMPTZ,
    end_datetime        TIMESTAMPTZ,
    allow_retake        BOOLEAN NOT NULL DEFAULT FALSE,
    max_retakes         SMALLINT DEFAULT 0,
    shuffle_questions   BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_options     BOOLEAN NOT NULL DEFAULT FALSE,
    show_results        BOOLEAN NOT NULL DEFAULT TRUE,
    show_correct_answers BOOLEAN NOT NULL DEFAULT FALSE,
    is_online           BOOLEAN NOT NULL DEFAULT FALSE,
    room_id             UUID REFERENCES schedule.rooms(id) ON DELETE SET NULL,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),
    updated_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_exams_marks CHECK (total_marks > 0 AND passing_marks >= 0 AND passing_marks <= total_marks),
    CONSTRAINT chk_exams_duration CHECK (duration_minutes > 0),
    CONSTRAINT chk_exams_dates CHECK (end_datetime IS NULL OR end_datetime > start_datetime),
    CONSTRAINT chk_exams_retakes CHECK (max_retakes >= 0)
);

CREATE INDEX idx_exams_org ON exam.exams(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exams_type ON exam.exams(exam_type_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exams_group ON exam.exams(group_id) WHERE group_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_exams_course ON exam.exams(course_id) WHERE course_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_exams_status ON exam.exams(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_exams_date ON exam.exams(organization_id, start_datetime) WHERE deleted_at IS NULL;

-- Sample Record:
-- title: 'B1 Midterm Exam - Grammar & Vocabulary', duration_minutes: 90,
-- total_marks: 100, passing_marks: 60, status: 'scheduled'

-- ============================================================================
-- TABLE: exam_questions
-- Purpose: Individual questions within an exam.
-- Why: Structured question bank per exam; supports various question types.
-- Business Rules: Questions ordered by sort_order. Points per question must sum to total_marks.
-- Relationships: belongs to exam (N:1)
-- ============================================================================

CREATE TABLE exam.exam_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    exam_id             UUID NOT NULL REFERENCES exam.exams(id) ON DELETE CASCADE,
    question_type       exam.question_type_enum NOT NULL,
    difficulty          exam.difficulty_enum DEFAULT 'medium',
    question_text       TEXT NOT NULL,
    question_media_url  TEXT,
    options             JSONB,
    correct_answer      JSONB NOT NULL,
    explanation         TEXT,
    points              DECIMAL(5, 2) NOT NULL DEFAULT 1,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    is_required         BOOLEAN NOT NULL DEFAULT TRUE,
    time_limit_seconds  SMALLINT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_questions_points CHECK (points > 0),
    CONSTRAINT chk_questions_time CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0)
);

CREATE INDEX idx_exam_questions_exam ON exam.exam_questions(exam_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_questions_org ON exam.exam_questions(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_questions_type ON exam.exam_questions(exam_id, question_type) WHERE deleted_at IS NULL;

-- Sample (multiple_choice):
-- question_text: 'Which tense is used for actions happening now?'
-- options: '["Past Simple","Present Continuous","Future Perfect","Past Perfect"]'
-- correct_answer: '{"answer": 1}' (index-based)
-- points: 2

-- ============================================================================
-- TABLE: exam_results
-- Purpose: A student's attempt/result for an exam.
-- Why: Track scores, answers, and pass/fail status per student per exam.
-- Business Rules: One result per attempt. Score auto-calculated for objective questions.
-- Relationships: belongs to exam (N:1), belongs to student (N:1)
-- ============================================================================

CREATE TABLE exam.exam_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    exam_id             UUID NOT NULL REFERENCES exam.exams(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    attempt_number      SMALLINT NOT NULL DEFAULT 1,
    status              exam.result_status_enum NOT NULL DEFAULT 'pending',
    score               DECIMAL(6, 2),
    total_marks         DECIMAL(6, 2) NOT NULL,
    percentage          DECIMAL(5, 2),
    is_passed           BOOLEAN,
    answers             JSONB DEFAULT '{}',
    started_at          TIMESTAMPTZ,
    submitted_at        TIMESTAMPTZ,
    graded_at           TIMESTAMPTZ,
    graded_by           UUID REFERENCES foundation.users(id),
    time_spent_seconds  INTEGER,
    feedback            TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_exam_results_attempt UNIQUE (exam_id, student_profile_id, attempt_number),
    CONSTRAINT chk_results_score CHECK (score IS NULL OR (score >= 0 AND score <= total_marks)),
    CONSTRAINT chk_results_percentage CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100)),
    CONSTRAINT chk_results_attempt CHECK (attempt_number >= 1),
    CONSTRAINT chk_results_time CHECK (time_spent_seconds IS NULL OR time_spent_seconds >= 0)
);

CREATE INDEX idx_exam_results_exam ON exam.exam_results(exam_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_results_student ON exam.exam_results(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_results_org ON exam.exam_results(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_results_passed ON exam.exam_results(exam_id, is_passed) WHERE deleted_at IS NULL;

-- Sample: exam_id=..., student_id=..., score=78, total_marks=100, percentage=78.00, is_passed=true

-- ============================================================================
-- TABLE: certificates
-- Purpose: Certificates issued to students upon course/exam completion.
-- Why: Digital credential management; verifiable proof of achievement.
-- Business Rules: Unique certificate number. Can be revoked. QR-verifiable.
-- Relationships: belongs to student (N:1), optionally to exam_result (N:1),
--                optionally to course (N:1)
-- ============================================================================

CREATE TABLE exam.certificates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    exam_result_id      UUID REFERENCES exam.exam_results(id) ON DELETE SET NULL,
    course_id           UUID REFERENCES course.courses(id) ON DELETE SET NULL,
    group_id            UUID REFERENCES "group".groups(id) ON DELETE SET NULL,
    certificate_number  VARCHAR(100) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    issued_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date         DATE,
    status              exam.certificate_status_enum NOT NULL DEFAULT 'issued',
    score               DECIMAL(5, 2),
    grade               VARCHAR(10),
    template_id         VARCHAR(50),
    file_url            TEXT,
    verification_url    TEXT,
    qr_code_data        TEXT,
    issued_by           UUID REFERENCES foundation.users(id),
    revoked_at          TIMESTAMPTZ,
    revoke_reason       TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_certificates_number UNIQUE (organization_id, certificate_number),
    CONSTRAINT chk_certificates_expiry CHECK (expiry_date IS NULL OR expiry_date > issued_date)
);

CREATE INDEX idx_certificates_student ON exam.certificates(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_certificates_org ON exam.certificates(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_certificates_number ON exam.certificates(certificate_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_certificates_course ON exam.certificates(course_id) WHERE course_id IS NOT NULL AND deleted_at IS NULL;

-- Sample: certificate_number='CERT-2026-00001', title='B1 Level Completion Certificate',
-- issued_date='2026-12-20', status='issued'

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_exam_types_updated_at BEFORE UPDATE ON exam.exam_types
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_exams_updated_at BEFORE UPDATE ON exam.exams
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_exam_questions_updated_at BEFORE UPDATE ON exam.exam_questions
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_exam_results_updated_at BEFORE UPDATE ON exam.exam_results
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_certificates_updated_at BEFORE UPDATE ON exam.certificates
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE exam.exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON exam.exam_types
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON exam.exams
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON exam.exam_questions
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON exam.exam_results
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON exam.certificates
    USING (organization_id = current_setting('app.current_org_id')::UUID);
