-- ============================================================================
-- EduCore LMS - Finance Module
-- Schema: finance
-- Tables: payment_plans, invoices, invoice_items, payments, transactions,
--         discounts, scholarships, expense_categories, expenses, payroll
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS finance;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE finance.payment_plan_type_enum AS ENUM (
    'one_time', 'monthly', 'quarterly', 'per_lesson', 'custom'
);

CREATE TYPE finance.invoice_status_enum AS ENUM (
    'draft', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded'
);

CREATE TYPE finance.payment_method_enum AS ENUM (
    'cash', 'card', 'bank_transfer', 'online', 'mobile_payment', 'other'
);

CREATE TYPE finance.payment_status_enum AS ENUM (
    'pending', 'completed', 'failed', 'refunded', 'cancelled'
);

CREATE TYPE finance.transaction_type_enum AS ENUM (
    'income', 'expense', 'refund', 'transfer', 'adjustment'
);

CREATE TYPE finance.discount_type_enum AS ENUM (
    'percentage', 'fixed_amount'
);

CREATE TYPE finance.scholarship_status_enum AS ENUM (
    'active', 'expired', 'revoked', 'pending'
);

CREATE TYPE finance.expense_status_enum AS ENUM (
    'pending', 'approved', 'rejected', 'paid'
);

CREATE TYPE finance.payroll_status_enum AS ENUM (
    'draft', 'calculated', 'approved', 'paid', 'cancelled'
);

-- ============================================================================
-- TABLE: payment_plans
-- Purpose: Define how students pay for courses (monthly, one-time, etc.)
-- Why: Flexible billing structures; auto-generate invoices based on plan.
-- Relationships: belongs to organization (N:1), referenced by invoices
-- ============================================================================

CREATE TABLE finance.payment_plans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    plan_type           finance.payment_plan_type_enum NOT NULL,
    amount              DECIMAL(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
    installments        SMALLINT DEFAULT 1,
    interval_days       SMALLINT,
    description         TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_payment_plans_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_plans_installments CHECK (installments >= 1),
    CONSTRAINT chk_payment_plans_interval CHECK (interval_days IS NULL OR interval_days > 0)
);

CREATE INDEX idx_payment_plans_org ON finance.payment_plans(organization_id) WHERE deleted_at IS NULL AND is_active = TRUE;

-- Sample: name='Monthly Payment', plan_type='monthly', amount=1500000, interval_days=30

-- ============================================================================
-- TABLE: invoices
-- Purpose: Billing documents issued to students for courses/services.
-- Why: Core financial record; tracks what is owed and payment status.
-- Business Rules: Auto-generated from payment plans or manually created.
--                 Due date triggers overdue status via scheduled job.
-- Relationships: belongs to student (N:1), has many items (1:N), has many payments (1:N)
-- ============================================================================

CREATE TABLE finance.invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE RESTRICT,
    group_id            UUID REFERENCES "group".groups(id) ON DELETE SET NULL,
    payment_plan_id     UUID REFERENCES finance.payment_plans(id) ON DELETE SET NULL,
    invoice_number      VARCHAR(50) NOT NULL,
    status              finance.invoice_status_enum NOT NULL DEFAULT 'pending',
    subtotal            DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_amount     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_amount        DECIMAL(12, 2) NOT NULL,
    paid_amount         DECIMAL(12, 2) NOT NULL DEFAULT 0,
    balance_due         DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
    issued_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date            DATE NOT NULL,
    paid_date           DATE,
    notes               TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT uq_invoices_org_number UNIQUE (organization_id, invoice_number),
    CONSTRAINT chk_invoices_total CHECK (total_amount >= 0),
    CONSTRAINT chk_invoices_paid CHECK (paid_amount >= 0 AND paid_amount <= total_amount),
    CONSTRAINT chk_invoices_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_invoices_due CHECK (due_date >= issued_date)
);

CREATE INDEX idx_invoices_org ON finance.invoices(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_student ON finance.invoices(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON finance.invoices(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due_date ON finance.invoices(organization_id, due_date) WHERE status IN ('pending', 'partially_paid') AND deleted_at IS NULL;
CREATE INDEX idx_invoices_number ON finance.invoices(organization_id, invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_group ON finance.invoices(group_id) WHERE group_id IS NOT NULL AND deleted_at IS NULL;

-- Sample Record:
-- invoice_number: 'INV-2026-0001', student: ..., total_amount: 2500000,
-- status: 'pending', issued_date: '2026-09-01', due_date: '2026-09-15'

-- ============================================================================
-- TABLE: invoice_items
-- Purpose: Line items within an invoice (course fee, materials, registration, etc.)
-- Why: Detailed breakdown of charges; supports multiple items per invoice.
-- Relationships: belongs to invoice (N:1)
-- ============================================================================

CREATE TABLE finance.invoice_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    invoice_id          UUID NOT NULL REFERENCES finance.invoices(id) ON DELETE CASCADE,
    description         VARCHAR(255) NOT NULL,
    quantity            DECIMAL(8, 2) NOT NULL DEFAULT 1,
    unit_price          DECIMAL(12, 2) NOT NULL,
    total_price         DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    discount_amount     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate            DECIMAL(5, 2) NOT NULL DEFAULT 0,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_invoice_items_qty CHECK (quantity > 0),
    CONSTRAINT chk_invoice_items_price CHECK (unit_price >= 0),
    CONSTRAINT chk_invoice_items_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_invoice_items_tax CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

CREATE INDEX idx_invoice_items_invoice ON finance.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_org ON finance.invoice_items(organization_id);

-- ============================================================================
-- TABLE: payments
-- Purpose: Records of money received from students toward invoices.
-- Why: Track each payment transaction; support partial payments.
-- Business Rules: Payment updates invoice paid_amount and status.
-- Relationships: belongs to invoice (N:1), generates transaction (1:1)
-- ============================================================================

CREATE TABLE finance.payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    invoice_id          UUID NOT NULL REFERENCES finance.invoices(id) ON DELETE RESTRICT,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE RESTRICT,
    amount              DECIMAL(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
    payment_method      finance.payment_method_enum NOT NULL,
    status              finance.payment_status_enum NOT NULL DEFAULT 'pending',
    reference_number    VARCHAR(100),
    receipt_number      VARCHAR(100),
    payment_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    notes               TEXT,
    refund_amount       DECIMAL(12, 2) DEFAULT 0,
    refunded_at         TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_refund CHECK (refund_amount >= 0 AND refund_amount <= amount)
);

CREATE INDEX idx_payments_invoice ON finance.payments(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_student ON finance.payments(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_org ON finance.payments(organization_id, payment_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status ON finance.payments(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_method ON finance.payments(organization_id, payment_method) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: transactions
-- Purpose: Unified financial ledger of all money movements.
-- Why: Double-entry-style record; reconciliation; financial reporting.
-- Business Rules: Immutable once created. Links to source (payment/expense/payroll).
-- Relationships: belongs to organization, references source entities
-- ============================================================================

CREATE TABLE finance.transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    transaction_type    finance.transaction_type_enum NOT NULL,
    amount              DECIMAL(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
    description         VARCHAR(500) NOT NULL,
    reference_type      VARCHAR(50),
    reference_id        UUID,
    payment_id          UUID REFERENCES finance.payments(id) ON DELETE SET NULL,
    balance_after       DECIMAL(14, 2),
    transaction_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()

    -- Immutable: no updated_at or deleted_at
);

CREATE INDEX idx_transactions_org ON finance.transactions(organization_id, transaction_date DESC);
CREATE INDEX idx_transactions_type ON finance.transactions(organization_id, transaction_type, transaction_date DESC);
CREATE INDEX idx_transactions_reference ON finance.transactions(reference_type, reference_id);
CREATE INDEX idx_transactions_payment ON finance.transactions(payment_id) WHERE payment_id IS NOT NULL;

-- ============================================================================
-- TABLE: discounts
-- Purpose: Reusable discount definitions (early bird, sibling, loyalty, etc.)
-- Why: Configurable discounts that can be applied to invoices consistently.
-- Business Rules: Can be limited by date range, usage count, or specific courses.
-- Relationships: belongs to organization (N:1), applied to invoices
-- ============================================================================

CREATE TABLE finance.discounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    code                VARCHAR(50),
    discount_type       finance.discount_type_enum NOT NULL,
    value               DECIMAL(12, 2) NOT NULL,
    max_uses            INTEGER,
    current_uses        INTEGER NOT NULL DEFAULT 0,
    min_purchase_amount DECIMAL(12, 2),
    valid_from          DATE,
    valid_to            DATE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    applicable_courses  UUID[],
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT uq_discounts_org_code UNIQUE (organization_id, code),
    CONSTRAINT chk_discounts_value CHECK (value > 0),
    CONSTRAINT chk_discounts_percentage CHECK (discount_type != 'percentage' OR value <= 100),
    CONSTRAINT chk_discounts_dates CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT chk_discounts_uses CHECK (max_uses IS NULL OR current_uses <= max_uses)
);

CREATE INDEX idx_discounts_org ON finance.discounts(organization_id) WHERE deleted_at IS NULL AND is_active = TRUE;
CREATE INDEX idx_discounts_code ON finance.discounts(organization_id, code) WHERE deleted_at IS NULL AND is_active = TRUE;

-- Sample: name='Early Bird 10%', code='EARLY10', discount_type='percentage', value=10

-- ============================================================================
-- TABLE: scholarships
-- Purpose: Financial aid/scholarships awarded to students.
-- Why: Track scholarship recipients, amounts, and validity periods.
-- Business Rules: Scholarship reduces invoice amount. Can cover partial or full fees.
-- Relationships: belongs to student (N:1), belongs to organization (N:1)
-- ============================================================================

CREATE TABLE finance.scholarships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    student_profile_id  UUID NOT NULL REFERENCES student.student_profiles(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    scholarship_type    finance.discount_type_enum NOT NULL,
    value               DECIMAL(12, 2) NOT NULL,
    reason              TEXT,
    status              finance.scholarship_status_enum NOT NULL DEFAULT 'active',
    valid_from          DATE NOT NULL,
    valid_to            DATE,
    approved_by         UUID REFERENCES foundation.users(id),
    approved_at         TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_scholarships_value CHECK (value > 0),
    CONSTRAINT chk_scholarships_percentage CHECK (scholarship_type != 'percentage' OR value <= 100),
    CONSTRAINT chk_scholarships_dates CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE INDEX idx_scholarships_student ON finance.scholarships(student_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_scholarships_org ON finance.scholarships(organization_id, status) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: expense_categories
-- Purpose: Hierarchical categorization of organizational expenses.
-- Why: Budget tracking, expense reporting, tax categorization.
-- Relationships: has many expenses (1:N), self-referencing parent
-- ============================================================================

CREATE TABLE finance.expense_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    parent_id           UUID REFERENCES finance.expense_categories(id) ON DELETE SET NULL,
    name                VARCHAR(100) NOT NULL,
    code                VARCHAR(20),
    description         TEXT,
    budget_monthly      DECIMAL(14, 2),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT uq_expense_categories_org_code UNIQUE (organization_id, code)
);

CREATE INDEX idx_expense_categories_org ON finance.expense_categories(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expense_categories_parent ON finance.expense_categories(parent_id) WHERE deleted_at IS NULL;

-- Sample: name='Office Supplies', code='OFF-SUP', budget_monthly=5000000

-- ============================================================================
-- TABLE: expenses
-- Purpose: Record organizational spending (rent, supplies, utilities, etc.)
-- Why: Track outgoing funds; budget management; financial reporting.
-- Business Rules: Requires approval for amounts above threshold.
-- Relationships: belongs to category (N:1), belongs to organization (N:1)
-- ============================================================================

CREATE TABLE finance.expenses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES foundation.branches(id) ON DELETE SET NULL,
    category_id         UUID NOT NULL REFERENCES finance.expense_categories(id) ON DELETE RESTRICT,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    amount              DECIMAL(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
    expense_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    status              finance.expense_status_enum NOT NULL DEFAULT 'pending',
    payment_method      finance.payment_method_enum,
    receipt_url         TEXT,
    vendor_name         VARCHAR(255),
    approved_by         UUID REFERENCES foundation.users(id),
    approved_at         TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),

    CONSTRAINT chk_expenses_amount CHECK (amount > 0)
);

CREATE INDEX idx_expenses_org ON finance.expenses(organization_id, expense_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_category ON finance.expenses(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_status ON finance.expenses(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_branch ON finance.expenses(branch_id) WHERE branch_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- TABLE: payroll
-- Purpose: Monthly/periodic salary payments to teachers and staff.
-- Why: Track salary disbursements, deductions, bonuses; integrate with teacher salaries.
-- Business Rules: One payroll record per teacher per pay period.
-- Relationships: belongs to teacher_profile (N:1), generates transaction
-- ============================================================================

CREATE TABLE finance.payroll (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES foundation.organizations(id) ON DELETE CASCADE,
    teacher_profile_id  UUID NOT NULL REFERENCES teacher.teacher_profiles(id) ON DELETE RESTRICT,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    base_salary         DECIMAL(12, 2) NOT NULL DEFAULT 0,
    bonus               DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deductions          DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(12, 2) NOT NULL DEFAULT 0,
    net_amount          DECIMAL(12, 2) GENERATED ALWAYS AS (base_salary + bonus - deductions - tax_amount) STORED,
    currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
    lessons_taught      SMALLINT DEFAULT 0,
    students_count      SMALLINT DEFAULT 0,
    status              finance.payroll_status_enum NOT NULL DEFAULT 'draft',
    payment_method      finance.payment_method_enum,
    paid_at             TIMESTAMPTZ,
    notes               TEXT,
    calculation_details JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    created_by          UUID REFERENCES foundation.users(id),
    approved_by         UUID REFERENCES foundation.users(id),

    CONSTRAINT uq_payroll_teacher_period UNIQUE (teacher_profile_id, period_start, period_end),
    CONSTRAINT chk_payroll_period CHECK (period_end > period_start),
    CONSTRAINT chk_payroll_amounts CHECK (base_salary >= 0 AND bonus >= 0 AND deductions >= 0 AND tax_amount >= 0)
);

CREATE INDEX idx_payroll_org ON finance.payroll(organization_id, period_start DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_teacher ON finance.payroll(teacher_profile_id, period_start DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_status ON finance.payroll(organization_id, status) WHERE deleted_at IS NULL;

-- Sample Record:
-- teacher_id: ..., period_start: '2026-09-01', period_end: '2026-09-30',
-- base_salary: 8000000, bonus: 500000, deductions: 0, tax_amount: 1020000,
-- net_amount: 7480000, status: 'paid'

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_payment_plans_updated_at BEFORE UPDATE ON finance.payment_plans
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON finance.invoices
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_invoice_items_updated_at BEFORE UPDATE ON finance.invoice_items
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON finance.payments
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_discounts_updated_at BEFORE UPDATE ON finance.discounts
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_scholarships_updated_at BEFORE UPDATE ON finance.scholarships
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_expense_categories_updated_at BEFORE UPDATE ON finance.expense_categories
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON finance.expenses
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

CREATE TRIGGER trg_payroll_updated_at BEFORE UPDATE ON finance.payroll
    FOR EACH ROW EXECUTE FUNCTION foundation.update_updated_at();

-- Auto-create transaction on payment completion
CREATE OR REPLACE FUNCTION finance.create_payment_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        INSERT INTO finance.transactions (
            organization_id, transaction_type, amount, currency, description,
            reference_type, reference_id, payment_id, transaction_date
        ) VALUES (
            NEW.organization_id, 'income', NEW.amount, NEW.currency,
            'Payment received: ' || COALESCE(NEW.receipt_number, NEW.id::TEXT),
            'payment', NEW.id, NEW.id, NEW.payment_date
        );

        -- Update invoice paid_amount
        UPDATE finance.invoices
        SET paid_amount = paid_amount + NEW.amount,
            status = CASE
                WHEN paid_amount + NEW.amount >= total_amount THEN 'paid'::finance.invoice_status_enum
                ELSE 'partially_paid'::finance.invoice_status_enum
            END,
            paid_date = CASE
                WHEN paid_amount + NEW.amount >= total_amount THEN CURRENT_DATE
                ELSE paid_date
            END
        WHERE id = NEW.invoice_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_completed AFTER INSERT OR UPDATE ON finance.payments
    FOR EACH ROW EXECUTE FUNCTION finance.create_payment_transaction();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE finance.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON finance.payment_plans
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON finance.invoices
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON finance.invoice_items
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON finance.payments
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON finance.transactions
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON finance.discounts
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON finance.scholarships
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON finance.expense_categories
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON finance.expenses
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY tenant_isolation ON finance.payroll
    USING (organization_id = current_setting('app.current_org_id')::UUID);
