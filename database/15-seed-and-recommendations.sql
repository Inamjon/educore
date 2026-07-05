-- ============================================================================
-- EduCore LMS - Seed Data, Extensions, Performance & Security
-- File: 15-seed-and-recommendations.sql
-- ============================================================================

-- ============================================================================
-- 1. REQUIRED EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;          -- UUID generation, encryption
CREATE EXTENSION IF NOT EXISTS pg_trgm;           -- Fuzzy text search (LIKE/ILIKE optimization)
CREATE EXTENSION IF NOT EXISTS btree_gin;         -- Composite GIN indexes
CREATE EXTENSION IF NOT EXISTS pg_stat_statements; -- Query performance monitoring
-- CREATE EXTENSION IF NOT EXISTS pgaudit;        -- Audit logging (enable in postgresql.conf)

-- ============================================================================
-- 2. SEED DATA
-- ============================================================================

-- 2.1 System Roles (platform-level, organization_id = NULL)
INSERT INTO foundation.roles (id, organization_id, name, slug, is_system, description) VALUES
    ('019145a1-0000-7000-8000-000000000001', NULL, 'Super Admin', 'super_admin', TRUE, 'Platform-level administrator with full access'),
    ('019145a1-0000-7000-8000-000000000002', NULL, 'Owner', 'owner', TRUE, 'Organization owner with full org access'),
    ('019145a1-0000-7000-8000-000000000003', NULL, 'Manager', 'manager', TRUE, 'Branch/organization manager'),
    ('019145a1-0000-7000-8000-000000000004', NULL, 'Administrator', 'administrator', TRUE, 'Administrative staff'),
    ('019145a1-0000-7000-8000-000000000005', NULL, 'Teacher', 'teacher', TRUE, 'Teaching staff'),
    ('019145a1-0000-7000-8000-000000000006', NULL, 'Student', 'student', TRUE, 'Enrolled student'),
    ('019145a1-0000-7000-8000-000000000007', NULL, 'Parent', 'parent', TRUE, 'Student parent/guardian');

-- 2.2 Permissions (CRUD for each module)
INSERT INTO foundation.permissions (module, action, description) VALUES
    -- Foundation
    ('organizations', 'create', 'Create organizations'),
    ('organizations', 'read', 'View organizations'),
    ('organizations', 'update', 'Update organizations'),
    ('organizations', 'delete', 'Delete organizations'),
    ('branches', 'create', 'Create branches'),
    ('branches', 'read', 'View branches'),
    ('branches', 'update', 'Update branches'),
    ('branches', 'delete', 'Delete branches'),
    ('users', 'create', 'Create users'),
    ('users', 'read', 'View users'),
    ('users', 'update', 'Update users'),
    ('users', 'delete', 'Delete users'),
    ('roles', 'create', 'Create roles'),
    ('roles', 'read', 'View roles'),
    ('roles', 'update', 'Update roles'),
    ('roles', 'delete', 'Delete roles'),
    ('settings', 'read', 'View settings'),
    ('settings', 'update', 'Update settings'),
    ('audit_logs', 'read', 'View audit logs'),
    ('files', 'create', 'Upload files'),
    ('files', 'read', 'View files'),
    ('files', 'delete', 'Delete files'),
    -- Students
    ('students', 'create', 'Create student profiles'),
    ('students', 'read', 'View student profiles'),
    ('students', 'update', 'Update student profiles'),
    ('students', 'delete', 'Delete student profiles'),
    ('students', 'export', 'Export student data'),
    -- Teachers
    ('teachers', 'create', 'Create teacher profiles'),
    ('teachers', 'read', 'View teacher profiles'),
    ('teachers', 'update', 'Update teacher profiles'),
    ('teachers', 'delete', 'Delete teacher profiles'),
    -- Courses
    ('courses', 'create', 'Create courses'),
    ('courses', 'read', 'View courses'),
    ('courses', 'update', 'Update courses'),
    ('courses', 'delete', 'Delete courses'),
    -- Groups
    ('groups', 'create', 'Create groups'),
    ('groups', 'read', 'View groups'),
    ('groups', 'update', 'Update groups'),
    ('groups', 'delete', 'Delete groups'),
    ('groups', 'enroll', 'Enroll students into groups'),
    ('groups', 'transfer', 'Transfer students between groups'),
    -- Schedule
    ('schedule', 'create', 'Create schedule entries'),
    ('schedule', 'read', 'View schedule'),
    ('schedule', 'update', 'Update schedule'),
    ('schedule', 'delete', 'Delete schedule entries'),
    -- Attendance
    ('attendance', 'create', 'Mark attendance'),
    ('attendance', 'read', 'View attendance'),
    ('attendance', 'update', 'Update attendance'),
    ('attendance', 'export', 'Export attendance data'),
    -- Homework
    ('homework', 'create', 'Create homework'),
    ('homework', 'read', 'View homework'),
    ('homework', 'update', 'Update homework'),
    ('homework', 'delete', 'Delete homework'),
    ('homework', 'grade', 'Grade homework submissions'),
    ('homework', 'submit', 'Submit homework'),
    -- Exams
    ('exams', 'create', 'Create exams'),
    ('exams', 'read', 'View exams'),
    ('exams', 'update', 'Update exams'),
    ('exams', 'delete', 'Delete exams'),
    ('exams', 'grade', 'Grade exams'),
    ('exams', 'take', 'Take exams'),
    -- Finance
    ('finance', 'create', 'Create financial records'),
    ('finance', 'read', 'View financial data'),
    ('finance', 'update', 'Update financial records'),
    ('finance', 'delete', 'Delete financial records'),
    ('finance', 'approve', 'Approve expenses/payroll'),
    ('payments', 'create', 'Record payments'),
    ('payments', 'read', 'View payments'),
    ('payments', 'refund', 'Process refunds'),
    -- Notifications
    ('notifications', 'create', 'Create notifications'),
    ('notifications', 'read', 'View notifications'),
    ('announcements', 'create', 'Create announcements'),
    ('announcements', 'read', 'View announcements'),
    ('announcements', 'update', 'Update announcements'),
    ('announcements', 'delete', 'Delete announcements'),
    -- Reports
    ('reports', 'read', 'View reports'),
    ('reports', 'generate', 'Generate reports'),
    ('reports', 'export', 'Export reports'),
    ('dashboard', 'read', 'View dashboard'),
    -- AI
    ('ai', 'chat', 'Use AI chat'),
    ('ai', 'recommendations', 'View AI recommendations'),
    ('ai', 'analytics', 'View AI analytics');

-- 2.3 Default Late Reasons (template for new organizations)
-- These would be cloned per organization during onboarding.
-- Example for a sample org:
-- INSERT INTO attendance.late_reasons (organization_id, title, is_excusable, is_system) VALUES
--     ('<org_id>', 'Traffic', FALSE, TRUE),
--     ('<org_id>', 'Medical appointment', TRUE, TRUE),
--     ('<org_id>', 'Family emergency', TRUE, TRUE),
--     ('<org_id>', 'Transportation issues', FALSE, TRUE),
--     ('<org_id>', 'Overslept', FALSE, TRUE),
--     ('<org_id>', 'Weather conditions', TRUE, TRUE);

-- 2.4 Default Exam Types (template)
-- INSERT INTO exam.exam_types (organization_id, name, slug, weight_percentage) VALUES
--     ('<org_id>', 'Placement Test', 'placement', NULL),
--     ('<org_id>', 'Quiz', 'quiz', 10),
--     ('<org_id>', 'Midterm Exam', 'midterm', 30),
--     ('<org_id>', 'Final Exam', 'final', 50),
--     ('<org_id>', 'Mock Exam', 'mock', NULL);

-- 2.5 Default Expense Categories (template)
-- INSERT INTO finance.expense_categories (organization_id, name, code) VALUES
--     ('<org_id>', 'Rent', 'RENT'),
--     ('<org_id>', 'Utilities', 'UTIL'),
--     ('<org_id>', 'Office Supplies', 'OFF'),
--     ('<org_id>', 'Marketing', 'MKT'),
--     ('<org_id>', 'Equipment', 'EQP'),
--     ('<org_id>', 'Maintenance', 'MNT'),
--     ('<org_id>', 'Software/Subscriptions', 'SW'),
--     ('<org_id>', 'Miscellaneous', 'MISC');

-- ============================================================================
-- 3. PERFORMANCE OPTIMIZATION
-- ============================================================================

-- 3.1 Partitioning Strategy (for large tables)
-- Audit logs: partition by month
-- CREATE TABLE foundation.audit_logs_partitioned (...) PARTITION BY RANGE (created_at);
-- CREATE TABLE foundation.audit_logs_y2026m01 PARTITION OF foundation.audit_logs_partitioned
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Transactions: partition by month
-- Attendance: partition by organization_id (hash) or created_at (range)
-- Notifications: partition by created_at (range)

-- 3.2 Connection Pooling Configuration (PgBouncer recommended)
-- transaction_pooling mode for multi-tenant workloads
-- max_client_connections: 10000
-- default_pool_size: 25
-- reserve_pool_size: 5

-- 3.3 PostgreSQL Configuration Recommendations
-- shared_buffers: 25% of RAM (e.g., 4GB for 16GB server)
-- effective_cache_size: 75% of RAM
-- work_mem: 64MB (adjust per concurrent queries)
-- maintenance_work_mem: 1GB
-- random_page_cost: 1.1 (SSD storage)
-- effective_io_concurrency: 200 (SSD)
-- max_worker_processes: 8
-- max_parallel_workers_per_gather: 4
-- max_parallel_workers: 8
-- wal_buffers: 64MB
-- checkpoint_completion_target: 0.9
-- default_statistics_target: 200

-- 3.4 Vacuum and Maintenance
-- autovacuum_max_workers: 4
-- autovacuum_naptime: 30s
-- autovacuum_vacuum_threshold: 50
-- autovacuum_analyze_threshold: 50
-- autovacuum_vacuum_scale_factor: 0.05
-- autovacuum_analyze_scale_factor: 0.025

-- 3.5 Materialized Views for Heavy Reports
CREATE MATERIALIZED VIEW IF NOT EXISTS report.mv_org_monthly_revenue AS
SELECT
    i.organization_id,
    DATE_TRUNC('month', p.payment_date) AS month,
    COUNT(DISTINCT p.id) AS payment_count,
    SUM(p.amount) AS total_revenue,
    COUNT(DISTINCT p.student_profile_id) AS paying_students
FROM finance.payments p
JOIN finance.invoices i ON p.invoice_id = i.id
WHERE p.status = 'completed' AND p.deleted_at IS NULL
GROUP BY i.organization_id, DATE_TRUNC('month', p.payment_date);

CREATE UNIQUE INDEX idx_mv_org_monthly_revenue ON report.mv_org_monthly_revenue(organization_id, month);

-- Refresh command (run via pg_cron or application scheduler):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY report.mv_org_monthly_revenue;

CREATE MATERIALIZED VIEW IF NOT EXISTS report.mv_group_attendance_summary AS
SELECT
    a.organization_id,
    a.group_id,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE a.status = 'present') AS present_count,
    COUNT(*) FILTER (WHERE a.status = 'absent') AS absent_count,
    COUNT(*) FILTER (WHERE a.status = 'late') AS late_count,
    ROUND(COUNT(*) FILTER (WHERE a.status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 2) AS attendance_rate
FROM attendance.attendances a
WHERE a.deleted_at IS NULL
GROUP BY a.organization_id, a.group_id;

CREATE UNIQUE INDEX idx_mv_group_attendance ON report.mv_group_attendance_summary(organization_id, group_id);

-- ============================================================================
-- 4. SECURITY RECOMMENDATIONS
-- ============================================================================

-- 4.1 Database Roles and Least Privilege
-- CREATE ROLE educore_app LOGIN PASSWORD '...' CONNECTION LIMIT 100;
-- CREATE ROLE educore_readonly LOGIN PASSWORD '...' CONNECTION LIMIT 20;
-- CREATE ROLE educore_admin LOGIN PASSWORD '...' CONNECTION LIMIT 5;

-- GRANT USAGE ON SCHEMA foundation, auth, student, teacher, course, "group",
--     schedule, attendance, homework, exam, finance, notification, report, ai
--     TO educore_app;

-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA foundation TO educore_app;
-- GRANT SELECT ON ALL TABLES IN SCHEMA foundation TO educore_readonly;

-- 4.2 Row Level Security (already enabled per table above)
-- Application MUST set: SET app.current_org_id = '<uuid>';
-- before executing tenant-scoped queries.

-- 4.3 SSL/TLS
-- ssl = on
-- ssl_cert_file = '/path/to/server.crt'
-- ssl_key_file = '/path/to/server.key'
-- ssl_ca_file = '/path/to/ca.crt'

-- 4.4 Password Policies (application level)
-- Minimum 8 characters, mixed case, numbers, special chars
-- bcrypt/argon2id with cost factor >= 12
-- Password history (prevent reuse of last 5)
-- Account lockout after 5 failed attempts (15 min cooldown)

-- 4.5 Encryption at Rest
-- Transparent Data Encryption (TDE) via cloud provider (AWS RDS, GCP Cloud SQL)
-- Sensitive columns (PII) encrypted at application level before storage

-- 4.6 Network Security
-- pg_hba.conf: restrict connections to application subnet only
-- No public internet access to database
-- VPC/private subnet deployment
-- Security groups: allow only app server IPs on port 5432

-- 4.7 Audit Trail
-- pgaudit.log = 'write, ddl'  (in postgresql.conf)
-- All data mutations logged to foundation.audit_logs via application middleware

-- 4.8 Backup Strategy
-- Continuous WAL archiving (point-in-time recovery)
-- Daily full backups with 30-day retention
-- Cross-region replication for disaster recovery
-- Monthly backup restoration testing

-- ============================================================================
-- 5. FUTURE SCALABILITY RECOMMENDATIONS
-- ============================================================================

-- 5.1 Read Replicas
-- Deploy 2+ read replicas for reporting/analytics queries
-- Route read-heavy operations (dashboard, reports, search) to replicas
-- Use streaming replication with synchronous commit for critical reads

-- 5.2 Caching Layer
-- Redis/Valkey for:
--   - Session storage
--   - Dashboard statistics cache
--   - Permission/role lookups
--   - Rate limiting counters
--   - Queue for notification delivery

-- 5.3 Horizontal Scaling Path
-- Phase 1 (current): Single primary + read replicas + RLS isolation
-- Phase 2 (10K+ orgs): Shard by organization_id using Citus or application-level routing
-- Phase 3 (100K+ orgs): Dedicated databases for enterprise tenants; shared pool for small ones

-- 5.4 Event Sourcing / CQRS (Future)
-- Consider event-driven architecture for:
--   - Attendance marking → Notification → Report update
--   - Payment received → Invoice update → Transaction → Dashboard refresh
-- Use PostgreSQL LISTEN/NOTIFY or external message broker (Kafka/RabbitMQ)

-- 5.5 Search
-- Dedicated search engine (Elasticsearch/Meilisearch) for:
--   - Student/teacher name search
--   - Course catalog search
--   - Full-text content search in homework/exam questions
-- Sync via CDC (Change Data Capture) with Debezium

-- 5.6 Archival Strategy
-- Move data older than 2 years to cold storage (S3 + Athena)
-- Archive tables: audit_logs, attendance, notifications, sms_logs, email_logs
-- Keep summary/aggregate data in PostgreSQL for historical reporting

-- ============================================================================
-- 6. MONITORING RECOMMENDATIONS
-- ============================================================================

-- Key metrics to monitor:
-- - Active connections vs max_connections
-- - Transaction rate (TPS)
-- - Query latency (p50, p95, p99)
-- - Cache hit ratio (should be > 99%)
-- - Replication lag
-- - Table bloat
-- - Long-running queries (> 5s)
-- - Dead tuples awaiting vacuum
-- - Disk usage growth rate

-- Recommended tools:
-- - pg_stat_statements for query analysis
-- - pgBadger for log analysis
-- - Prometheus + Grafana for real-time monitoring
-- - PgHero for quick health checks
-- - AWS CloudWatch / RDS Performance Insights (if on AWS)
