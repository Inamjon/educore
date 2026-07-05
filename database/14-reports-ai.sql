-- ============================================================================
-- EduCore LMS - Reports & AI Module
-- Schemas: report, ai
-- Tables: student_reports, teacher_reports, attendance_reports,
--         finance_reports, dashboard_statistics,
--         ai_chat_history, ai_recommendations, ai_learning_analytics
-- ============================================================================

-- ======================== REPORT SCHEMA =====================================

CREATE SCHEMA IF NOT EXISTS report;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE report.report_status_enum AS ENUM (
    'generating', 'ready', 'failed', 'archived'
);

CREATE TYPE report.report_period_enum AS ENUM (
    'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
);

-- ============================================================================
-- TABLE: student_reports
-- Purpose: Pre-generated/cached student performance reports.
-- Why: Avoid expensive real-time queries; provide downloadable report snapshots.
-- Business Rules: Generated on schedule or on-demand. Contains aggregated metrics.
-- Relationships: belongs to student (N:1), belongs to organization (N:1)
-- ============================================================================

CREATE TABLE report.student_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    group_id            UUID REFERENCES "group".groups(id) ON DELETE SET NULL,
    period_type         report.report_period_enum NOT NULL,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    status              report.report_status_enum NOT NULL DEFAULT 'generating',
    attendance_rate     DECIMAL(5, 2),
    homework_completion_rate DECIMAL(5, 2),
    average_grade       DECIMAL(5, 2),
    exam_average        DECIMAL(5, 2),
    lessons_attended    SMALLINT DEFAULT 0,
    lessons_total       SMALLINT DEFAULT 0,
    homeworks_submitted SMALLINT DEFAULT 0,
    homeworks_total     SMALLINT DEFAULT 0,
    strengths           JSONB DEFAULT '[]',
    weaknesses          JSONB DEFAULT '[]',
    teacher_comments    TEXT,
    report_data         JSONB DEFAULT '{}',
    file_url            TEXT,
    generated_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    generated_by        UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_student_reports_period CHECK (period_end >= period_start),
    CONSTRAINT chk_student_reports_rates CHECK (
        (attendance_rate IS NULL OR (attendance_rate >= 0 AND attendance_rate <= 100)) AND
        (homework_completion_rate IS NULL OR (homework_completion_rate >= 0 AND homework_completion_rate <= 100))
    )
);

CREATE INDEX idx_student_reports_student ON report.student_reports(student_profile_id, period_start DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_reports_org ON report.student_reports(organization_id, period_start DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_reports_group ON report.student_reports(group_id) WHERE group_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- TABLE: teacher_reports
-- Purpose: Teacher performance and workload reports.
-- Why: Management needs teacher KPIs; helps with resource allocation.
-- Relationships: belongs to teacher (N:1), belongs to organization (N:1)
-- ============================================================================

CREATE TABLE report.teacher_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    teacher_profile_id  UUID NOT NULL REFERENCES teacher.teacher_profiles(id) ON DELETE CASCADE,
    period_type         report.report_period_enum NOT NULL,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    status              report.report_status_enum NOT NULL DEFAULT 'generating',
    lessons_taught      SMALLINT DEFAULT 0,
    lessons_cancelled   SMALLINT DEFAULT 0,
    total_students      SMALLINT DEFAULT 0,
    average_attendance_rate DECIMAL(5, 2),
    average_student_grade DECIMAL(5, 2),
    homework_assigned   SMALLINT DEFAULT 0,
    homework_graded     SMALLINT DEFAULT 0,
    groups_count        SMALLINT DEFAULT 0,
    report_data         JSONB DEFAULT '{}',
    generated_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_teacher_reports_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_teacher_reports_teacher ON report.teacher_reports(teacher_profile_id, period_start DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_teacher_reports_org ON report.teacher_reports(organization_id, period_start DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: attendance_reports
-- Purpose: Aggregated attendance statistics for groups/branches/org.
-- Why: Management dashboards; trend analysis; identify at-risk students.
-- Relationships: belongs to organization (N:1)
-- ============================================================================

CREATE TABLE report.attendance_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE SET NULL,
    group_id            UUID REFERENCES "group".groups(id) ON DELETE SET NULL,
    period_type         report.report_period_enum NOT NULL,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    status              report.report_status_enum NOT NULL DEFAULT 'generating',
    total_lessons       SMALLINT DEFAULT 0,
    total_students      SMALLINT DEFAULT 0,
    average_attendance_rate DECIMAL(5, 2),
    present_count       INTEGER DEFAULT 0,
    absent_count        INTEGER DEFAULT 0,
    late_count          INTEGER DEFAULT 0,
    excused_count       INTEGER DEFAULT 0,
    at_risk_students    JSONB DEFAULT '[]',
    report_data         JSONB DEFAULT '{}',
    generated_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_attendance_reports_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_attendance_reports_org ON report.attendance_reports(organization_id, period_start DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_reports_branch ON report.attendance_reports(branch_id) WHERE branch_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_attendance_reports_group ON report.attendance_reports(group_id) WHERE group_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- TABLE: finance_reports
-- Purpose: Financial summaries (revenue, expenses, profit, debts).
-- Why: Management financial visibility; forecasting; investor reporting.
-- Relationships: belongs to organization (N:1)
-- ============================================================================

CREATE TABLE report.finance_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE SET NULL,
    period_type         report.report_period_enum NOT NULL,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    status              report.report_status_enum NOT NULL DEFAULT 'generating',
    total_revenue       DECIMAL(14, 2) DEFAULT 0,
    total_expenses      DECIMAL(14, 2) DEFAULT 0,
    net_profit          DECIMAL(14, 2) DEFAULT 0,
    total_invoiced      DECIMAL(14, 2) DEFAULT 0,
    total_collected     DECIMAL(14, 2) DEFAULT 0,
    total_outstanding   DECIMAL(14, 2) DEFAULT 0,
    total_overdue       DECIMAL(14, 2) DEFAULT 0,
    payroll_total       DECIMAL(14, 2) DEFAULT 0,
    new_enrollments     INTEGER DEFAULT 0,
    currency            VARCHAR(3) DEFAULT 'UZS',
    report_data         JSONB DEFAULT '{}',
    generated_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT chk_finance_reports_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_finance_reports_org ON report.finance_reports(organization_id, period_start DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_finance_reports_branch ON report.finance_reports(branch_id) WHERE branch_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- TABLE: dashboard_statistics
-- Purpose: Pre-computed real-time dashboard metrics (cached for performance).
-- Why: Avoid expensive aggregations on every dashboard load.
-- Business Rules: Refreshed periodically (every 5-15 min) by background job.
-- Relationships: belongs to organization (N:1)
-- ============================================================================

CREATE TABLE report.dashboard_statistics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE SET NULL,
    metric_name         VARCHAR(100) NOT NULL,
    metric_value        DECIMAL(14, 2) NOT NULL,
    metric_type         VARCHAR(50) NOT NULL DEFAULT 'count',
    comparison_value    DECIMAL(14, 2),
    comparison_period   VARCHAR(20),
    change_percentage   DECIMAL(7, 2),
    date_reference      DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata            JSONB DEFAULT '{}',
    calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_dashboard_stats UNIQUE (organization_id, branch_id, metric_name, date_reference)
);

CREATE INDEX idx_dashboard_stats_org ON report.dashboard_statistics(organization_id, date_reference DESC);
CREATE INDEX idx_dashboard_stats_metric ON report.dashboard_statistics(organization_id, metric_name, date_reference DESC);

-- Sample metrics: 'active_students', 'monthly_revenue', 'today_attendance_rate',
-- 'overdue_invoices_count', 'lessons_today', 'new_enrollments_this_month'

-- ======================== AI SCHEMA =========================================

CREATE SCHEMA IF NOT EXISTS ai;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE ai.chat_role_enum AS ENUM ('user', 'assistant', 'system');

CREATE TYPE ai.recommendation_type_enum AS ENUM (
    'course_suggestion', 'study_plan', 'performance_alert',
    'schedule_optimization', 'engagement_boost', 'level_change'
);

CREATE TYPE ai.recommendation_status_enum AS ENUM (
    'pending', 'viewed', 'accepted', 'dismissed', 'expired'
);

-- ============================================================================
-- TABLE: ai_chat_history
-- Purpose: Store AI assistant chat conversations for users.
-- Why: Continuity in AI interactions; training data; usage analytics.
-- Business Rules: Messages stored per conversation session.
-- Relationships: belongs to user (N:1)
-- ============================================================================

CREATE TABLE ai.ai_chat_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES foundation.users(id) ON DELETE CASCADE,
    session_id          UUID NOT NULL,
    role                ai.chat_role_enum NOT NULL,
    content             TEXT NOT NULL,
    tokens_used         INTEGER DEFAULT 0,
    model_name          VARCHAR(50),
    response_time_ms    INTEGER,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()

    -- Immutable: no updated_at/deleted_at
);

CREATE INDEX idx_ai_chat_history_user ON ai.ai_chat_history(user_id, session_id, created_at);
CREATE INDEX idx_ai_chat_history_session ON ai.ai_chat_history(session_id, created_at);
CREATE INDEX idx_ai_chat_history_org ON ai.ai_chat_history(organization_id, created_at DESC);

-- ============================================================================
-- TABLE: ai_recommendations
-- Purpose: AI-generated recommendations for students/teachers/admins.
-- Why: Personalized actionable insights; improve outcomes through AI.
-- Business Rules: Generated by ML pipeline. Displayed to relevant user. Trackable.
-- Relationships: belongs to student (N:1), belongs to organization (N:1)
-- ============================================================================

CREATE TABLE ai.ai_recommendations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES foundation.users(id) ON DELETE CASCADE,
    recommendation_type ai.recommendation_type_enum NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    confidence_score    DECIMAL(4, 3),
    priority            SMALLINT NOT NULL DEFAULT 5,
    status              ai.recommendation_status_enum NOT NULL DEFAULT 'pending',
    action_url          TEXT,
    reasoning           JSONB DEFAULT '{}',
    viewed_at           TIMESTAMPTZ,
    actioned_at         TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_recommendations_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
    CONSTRAINT chk_recommendations_priority CHECK (priority BETWEEN 1 AND 10)
);

CREATE INDEX idx_ai_recommendations_student ON ai.ai_recommendations(student_profile_id, status) WHERE student_profile_id IS NOT NULL;
CREATE INDEX idx_ai_recommendations_user ON ai.ai_recommendations(user_id, status) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ai_recommendations_org ON ai.ai_recommendations(organization_id, recommendation_type, created_at DESC);
CREATE INDEX idx_ai_recommendations_pending ON ai.ai_recommendations(organization_id, status) WHERE status = 'pending';

-- Sample: type='performance_alert', title='Attendance dropping for Aziz Karimov',
-- description='Student attendance dropped below 70% in the last 2 weeks.', confidence_score=0.92

-- ============================================================================
-- TABLE: ai_learning_analytics
-- Purpose: ML-generated learning insights and predictions per student.
-- Why: Predict at-risk students, optimal pace, recommended difficulty levels.
-- Business Rules: Updated by ML pipeline on schedule. Historical snapshots kept.
-- Relationships: belongs to student (N:1)
-- ============================================================================

CREATE TABLE ai.ai_learning_analytics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    group_id            UUID REFERENCES "group".groups(id) ON DELETE SET NULL,
    analysis_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    learning_pace       VARCHAR(20),
    engagement_score    DECIMAL(4, 3),
    risk_score          DECIMAL(4, 3),
    predicted_grade     DECIMAL(5, 2),
    predicted_completion_probability DECIMAL(4, 3),
    recommended_level   VARCHAR(50),
    strengths           JSONB DEFAULT '[]',
    improvement_areas   JSONB DEFAULT '[]',
    study_patterns      JSONB DEFAULT '{}',
    model_version       VARCHAR(20),
    features_used       JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_analytics_engagement CHECK (engagement_score IS NULL OR (engagement_score >= 0 AND engagement_score <= 1)),
    CONSTRAINT chk_analytics_risk CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 1)),
    CONSTRAINT chk_analytics_completion CHECK (predicted_completion_probability IS NULL OR (predicted_completion_probability >= 0 AND predicted_completion_probability <= 1))
);

CREATE INDEX idx_ai_learning_analytics_student ON ai.ai_learning_analytics(student_profile_id, analysis_date DESC);
CREATE INDEX idx_ai_learning_analytics_org ON ai.ai_learning_analytics(organization_id, analysis_date DESC);
CREATE INDEX idx_ai_learning_analytics_risk ON ai.ai_learning_analytics(organization_id, risk_score DESC) WHERE risk_score > 0.7;
CREATE INDEX idx_ai_learning_analytics_group ON ai.ai_learning_analytics(group_id, analysis_date DESC) WHERE group_id IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_student_reports_updated_at BEFORE UPDATE ON report.student_reports
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_teacher_reports_updated_at BEFORE UPDATE ON report.teacher_reports
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_attendance_reports_updated_at BEFORE UPDATE ON report.attendance_reports
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_finance_reports_updated_at BEFORE UPDATE ON report.finance_reports
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_dashboard_stats_updated_at BEFORE UPDATE ON report.dashboard_statistics
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_ai_recommendations_updated_at BEFORE UPDATE ON ai.ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE report.student_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report.teacher_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report.attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report.finance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report.dashboard_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai.ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai.ai_learning_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON report.student_reports
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON report.teacher_reports
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON report.attendance_reports
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON report.finance_reports
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON report.dashboard_statistics
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON ai.ai_chat_history
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON ai.ai_recommendations
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON ai.ai_learning_analytics
    USING (organization_id = current_setting('app.current_org_id')::UUID);
