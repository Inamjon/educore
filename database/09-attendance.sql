-- ============================================================================
-- EduCore LMS - Attendance Module
-- Schema: attendance
-- Tables: attendances, late_reasons, attendance_history
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS attendance;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE attendance.attendance_status_enum AS ENUM (
    'present', 'absent', 'late', 'excused', 'early_leave', 'sick'
);

-- ============================================================================
-- TABLE: attendances
-- Purpose: Record each student's attendance for every lesson.
-- Why: Core tracking for student engagement, billing, and reporting.
-- Business Rules: One record per student per lesson. Status can be updated by teacher.
-- Relationships: belongs to lesson (N:1), belongs to student_profile (N:1)
-- ============================================================================

CREATE TABLE attendance.attendances (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    lesson_id           UUID NOT NULL REFERENCES schedule.lessons(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    group_id            UUID NOT NULL REFERENCES "group".groups(id) ON DELETE CASCADE,
    status              attendance.attendance_status_enum NOT NULL DEFAULT 'present',
    check_in_time       TIME,
    check_out_time      TIME,
    minutes_late        SMALLINT DEFAULT 0,
    late_reason_id      UUID,
    notes               TEXT,
    marked_by           UUID REFERENCES foundation.users(id),
    marked_at           TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_attendance_lesson_student UNIQUE (lesson_id, student_profile_id),
    CONSTRAINT chk_attendance_late_minutes CHECK (minutes_late >= 0)
);

CREATE INDEX idx_attendances_lesson ON attendance.attendances(lesson_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendances_student ON attendance.attendances(student_profile_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendances_group ON attendance.attendances(group_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendances_org_date ON attendance.attendances(organization_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendances_status ON attendance.attendances(organization_id, status) WHERE deleted_at IS NULL;

-- Sample Record:
-- lesson_id: ..., student_profile_id: ..., status: 'present', check_in_time: '10:00', marked_by: <teacher_user_id>

-- ============================================================================
-- TABLE: late_reasons
-- Purpose: Predefined and custom reasons for lateness/absence.
-- Why: Standardize reason tracking for reporting and analytics.
-- Business Rules: Organization can define custom reasons. System provides defaults.
-- Relationships: referenced by attendances (1:N)
-- ============================================================================

CREATE TABLE attendance.late_reasons (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    title               VARCHAR(100) NOT NULL,
    description         TEXT,
    is_excusable        BOOLEAN NOT NULL DEFAULT FALSE,
    is_system           BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_late_reasons_org_title UNIQUE (organization_id, title)
);

CREATE INDEX idx_late_reasons_org ON attendance.late_reasons(organization_id) WHERE deleted_at IS NULL AND is_active = TRUE;

-- Add FK now that late_reasons table exists
ALTER TABLE attendance.attendances
    ADD CONSTRAINT fk_attendances_late_reason
    FOREIGN KEY (late_reason_id) REFERENCES attendance.late_reasons(id) ON DELETE SET NULL;

-- Sample: title='Traffic', is_excusable=false
-- Sample: title='Medical appointment', is_excusable=true

-- ============================================================================
-- TABLE: attendance_history
-- Purpose: Audit trail for attendance status changes.
-- Why: Track corrections/overrides; dispute resolution; compliance.
-- Business Rules: Append-only. Created whenever attendance status is modified.
-- Relationships: belongs to attendance (N:1)
-- ============================================================================

CREATE TABLE attendance.attendance_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    attendance_id       UUID NOT NULL REFERENCES attendance.attendances(id) ON DELETE CASCADE,
    previous_status     attendance.attendance_status_enum,
    new_status          attendance.attendance_status_enum NOT NULL,
    reason              TEXT,
    changed_by          UUID REFERENCES foundation.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()

    -- Immutable: no updated_at or deleted_at
);

CREATE INDEX idx_attendance_history_attendance ON attendance.attendance_history(attendance_id, created_at DESC);
CREATE INDEX idx_attendance_history_org ON attendance.attendance_history(organization_id, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_attendances_updated_at BEFORE UPDATE ON attendance.attendances
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_late_reasons_updated_at BEFORE UPDATE ON attendance.late_reasons
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- Auto-create history record on attendance status change
CREATE OR REPLACE FUNCTION attendance.track_attendance_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO attendance.attendance_history (organization_id, attendance_id, previous_status, new_status, changed_by)
        VALUES (NEW.organization_id, NEW.id, OLD.status, NEW.status, NEW.marked_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attendance_status_change AFTER UPDATE ON attendance.attendances
    FOR EACH ROW EXECUTE FUNCTION attendance.track_attendance_change();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE attendance.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance.late_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance.attendance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON attendance.attendances
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON attendance.late_reasons
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON attendance.attendance_history
    USING (organization_id = current_setting('app.current_org_id')::UUID);
