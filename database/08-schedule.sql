-- ============================================================================
-- EduCore LMS - Schedule Module
-- Schema: schedule
-- Tables: rooms, lesson_schedules, lessons, holidays, calendar_events
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS schedule;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE schedule.room_type_enum AS ENUM (
    'classroom', 'lab', 'auditorium', 'online', 'other'
);

CREATE TYPE schedule.lesson_status_enum AS ENUM (
    'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'
);

CREATE TYPE schedule.event_type_enum AS ENUM (
    'holiday', 'exam', 'meeting', 'event', 'maintenance', 'other'
);

CREATE TYPE schedule.recurrence_enum AS ENUM (
    'none', 'daily', 'weekly', 'biweekly', 'monthly'
);

-- ============================================================================
-- TABLE: rooms
-- Purpose: Physical or virtual rooms where lessons take place.
-- Why: Room allocation, conflict detection, capacity management.
-- Relationships: belongs to branch (N:1), has many lessons (1:N)
-- ============================================================================

CREATE TABLE schedule.rooms (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES foundation.branches(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    code                VARCHAR(20),
    room_type           schedule.room_type_enum NOT NULL DEFAULT 'classroom',
    capacity            SMALLINT NOT NULL DEFAULT 20,
    floor               SMALLINT,
    building            VARCHAR(100),
    equipment           JSONB DEFAULT '[]',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    color               VARCHAR(7),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_rooms_org_branch_code UNIQUE (organization_id, branch_id, code),
    CONSTRAINT chk_rooms_capacity CHECK (capacity > 0)
);

CREATE INDEX idx_rooms_org ON schedule.rooms(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_branch ON schedule.rooms(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_type ON schedule.rooms(organization_id, room_type) WHERE deleted_at IS NULL;

-- Sample: name='Room 101', code='R101', room_type='classroom', capacity=20, floor=1

-- ============================================================================
-- TABLE: lesson_schedules
-- Purpose: Recurring weekly schedule template for a group.
-- Why: Define repeating patterns (e.g., Mon/Wed/Fri 10:00-11:30).
--      Individual lesson instances are generated from this template.
-- Business Rules: Used to auto-generate lesson records. No time overlap per room.
-- Relationships: belongs to group (N:1), belongs to room (N:1), belongs to teacher (N:1)
-- ============================================================================

CREATE TABLE schedule.lesson_schedules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    group_id            UUID NOT NULL REFERENCES "group".groups(id) ON DELETE CASCADE,
    room_id             UUID REFERENCES schedule.rooms(id) ON DELETE SET NULL,
    teacher_profile_id  UUID REFERENCES teacher.teacher_profiles(id) ON DELETE SET NULL,
    day_of_week         SMALLINT NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    recurrence          schedule.recurrence_enum NOT NULL DEFAULT 'weekly',
    effective_from      DATE NOT NULL,
    effective_to        DATE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_lesson_schedules_time CHECK (end_time > start_time),
    CONSTRAINT chk_lesson_schedules_dow CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_lesson_schedules_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_lesson_schedules_group ON schedule.lesson_schedules(group_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lesson_schedules_room ON schedule.lesson_schedules(room_id, day_of_week) WHERE deleted_at IS NULL AND is_active = TRUE;
CREATE INDEX idx_lesson_schedules_teacher ON schedule.lesson_schedules(teacher_profile_id, day_of_week) WHERE deleted_at IS NULL AND is_active = TRUE;
CREATE INDEX idx_lesson_schedules_org ON schedule.lesson_schedules(organization_id) WHERE deleted_at IS NULL;

-- Sample: group_id=..., day_of_week=1 (Monday), start_time='10:00', end_time='11:30', recurrence='weekly'

-- ============================================================================
-- TABLE: lessons
-- Purpose: Individual lesson instances (actual class meetings).
-- Why: Track each actual lesson for attendance, homework, and reporting.
-- Business Rules: Generated from lesson_schedules or created ad-hoc.
-- Relationships: belongs to group (N:1), belongs to room (N:1),
--                belongs to lesson_schedule (N:1), has many attendances (1:N)
-- ============================================================================

CREATE TABLE schedule.lessons (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    group_id            UUID NOT NULL REFERENCES "group".groups(id) ON DELETE CASCADE,
    lesson_schedule_id  UUID REFERENCES schedule.lesson_schedules(id) ON DELETE SET NULL,
    room_id             UUID REFERENCES schedule.rooms(id) ON DELETE SET NULL,
    teacher_profile_id  UUID REFERENCES teacher.teacher_profiles(id) ON DELETE SET NULL,
    lesson_number       SMALLINT,
    title               VARCHAR(255),
    description         TEXT,
    lesson_date         DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    status              schedule.lesson_status_enum NOT NULL DEFAULT 'scheduled',
    actual_start_time   TIME,
    actual_end_time     TIME,
    topic               TEXT,
    homework_assigned   BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),
    updated_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_lessons_time CHECK (end_time > start_time),
    CONSTRAINT chk_lessons_number CHECK (lesson_number IS NULL OR lesson_number > 0)
);

CREATE INDEX idx_lessons_group ON schedule.lessons(group_id, lesson_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_org_date ON schedule.lessons(organization_id, lesson_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_room_date ON schedule.lessons(room_id, lesson_date, start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_teacher_date ON schedule.lessons(teacher_profile_id, lesson_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_status ON schedule.lessons(organization_id, status, lesson_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_schedule ON schedule.lessons(lesson_schedule_id) WHERE deleted_at IS NULL;

-- Sample Record:
-- group_id: ..., lesson_date: '2026-09-01', start_time: '10:00', end_time: '11:30',
-- status: 'completed', lesson_number: 1, topic: 'Introduction to Grammar'

-- ============================================================================
-- TABLE: holidays
-- Purpose: Organization-wide or branch-specific non-working days.
-- Why: Exclude holidays from schedule generation; display in calendar.
-- Business Rules: Lessons on holidays are auto-cancelled or not generated.
-- Relationships: belongs to organization (N:1), optionally to branch
-- ============================================================================

CREATE TABLE schedule.holidays (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
    affects_all_branches BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_holidays_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_holidays_org ON schedule.holidays(organization_id, start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_holidays_branch ON schedule.holidays(branch_id, start_date) WHERE branch_id IS NOT NULL AND deleted_at IS NULL;

-- Sample: name='Navro''z', start_date='2026-03-21', end_date='2026-03-23', is_recurring=true

-- ============================================================================
-- TABLE: calendar_events
-- Purpose: General calendar events (exams, meetings, open days, etc.)
-- Why: Unified calendar view for all scheduled activities beyond lessons.
-- Relationships: belongs to organization (N:1), optionally to branch/group
-- ============================================================================

CREATE TABLE schedule.calendar_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE SET NULL,
    group_id            UUID REFERENCES "group".groups(id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    event_type          schedule.event_type_enum NOT NULL DEFAULT 'event',
    start_datetime      TIMESTAMPTZ NOT NULL,
    end_datetime        TIMESTAMPTZ NOT NULL,
    is_all_day          BOOLEAN NOT NULL DEFAULT FALSE,
    location            VARCHAR(255),
    color               VARCHAR(7),
    is_public           BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence          schedule.recurrence_enum DEFAULT 'none',
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_calendar_events_dates CHECK (end_datetime >= start_datetime)
);

CREATE INDEX idx_calendar_events_org ON schedule.calendar_events(organization_id, start_datetime) WHERE deleted_at IS NULL;
CREATE INDEX idx_calendar_events_type ON schedule.calendar_events(organization_id, event_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_calendar_events_branch ON schedule.calendar_events(branch_id, start_datetime) WHERE branch_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON schedule.rooms
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_lesson_schedules_updated_at BEFORE UPDATE ON schedule.lesson_schedules
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON schedule.lessons
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_holidays_updated_at BEFORE UPDATE ON schedule.holidays
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_calendar_events_updated_at BEFORE UPDATE ON schedule.calendar_events
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE schedule.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule.lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON schedule.rooms
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON schedule.lesson_schedules
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON schedule.lessons
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON schedule.holidays
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON schedule.calendar_events
    USING (organization_id = current_setting('app.current_org_id')::UUID);
