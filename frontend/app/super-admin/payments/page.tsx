'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Download,
  X,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { SearchInput, Select } from '@/components/ui/input';
import { PaymentStatus } from '@/lib/super-admin-data';
import { useSAPaymentsStore, type SAPayment } from '@/lib/store/sa-payments-store';
import { toast } from '@/lib/store/toast-store';
import { formatCurrency } from '@/lib/utils';

// ─── CSV download helper ──────────────────────────────────────────────────────

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Payment Status Badge ─────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; className: string }> = {
    paid:     { label: 'Paid',     className: 'bg-emerald-50 text-emerald-700' },
    pending:  { label: 'Pending',  className: 'bg-amber-50 text-amber-700' },
    failed:   { label: 'Failed',   className: 'bg-red-50 text-red-600' },
    refunded: { label: 'Refunded', className: 'bg-slate-100 text-slate-600' },
  };
  const cfg = map[status] ?? { label: status, className: 'bg-slate-50 text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}

// ─── Method Badge ─────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    card: 'bg-indigo-50 text-indigo-700',
    transfer: 'bg-violet-50 text-violet-700',
    online: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium capitalize ${map[method] ?? 'bg-slate-50 text-slate-600'}`}>
      {method === 'card' && '💳 '}
      {method === 'transfer' && '🏦 '}
      {method === 'online' && '🌐 '}
      {method}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const payments = useSAPaymentsStore((s) => s.items);
  const updatePayment = useSAPaymentsStore((s) => s.update);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter((p) => p.status === 'paid').length;
  const totalPending = payments.filter((p) => p.status === 'pending').length;
  const totalFailed = payments.filter((p) => p.status === 'failed').length;

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const matchSearch =
        !q ||
        p.centerName.toLowerCase().includes(q) ||
        p.invoiceId.toLowerCase().includes(q) ||
        p.plan.toLowerCase().includes(q);
      const matchStatus = !filterStatus || p.status === filterStatus;
      const matchPlan = !filterPlan || p.plan.toLowerCase() === filterPlan;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [payments, search, filterStatus, filterPlan]);

  const handleExportCsv = () => {
    downloadCsv('payments-export.csv', [
      ['Invoice', 'Center', 'Plan', 'Amount', 'Method', 'Date', 'Status'],
      ...filtered.map((p) => [p.invoiceId, p.centerName, p.plan, String(p.amount), p.method, p.date, p.status]),
    ]);
    toast.success('Payments exported');
  };

  const handleDownloadInvoice = (payment: SAPayment) => {
    downloadCsv(`${payment.invoiceId}.csv`, [
      ['Invoice', 'Center', 'Plan', 'Amount', 'Method', 'Date', 'Status'],
      [payment.invoiceId, payment.centerName, payment.plan, String(payment.amount), payment.method, payment.date, payment.status],
    ]);
    toast.success(`Invoice ${payment.invoiceId} downloaded`);
  };

  const handleRetry = (payment: SAPayment) => {
    updatePayment(payment.id, { status: 'paid' });
    toast.success(`Payment ${payment.invoiceId} marked as paid`);
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<SAPayment>[] = [
    {
      key: 'invoiceId',
      label: 'Invoice',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <span className="font-mono text-sm font-medium text-indigo-600">{row.invoiceId}</span>
        </div>
      ),
    },
    {
      key: 'centerName',
      label: 'Center',
      render: (_, row) => (
        <span className="font-medium text-slate-800">{row.centerName}</span>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (_, row) => (
        <Badge
          label={row.plan}
          variant={
            row.plan === 'Enterprise' ? 'warning' :
            row.plan === 'Pro' ? 'purple' :
            row.plan === 'Basic' ? 'info' : 'secondary'
          }
        />
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (_, row) => (
        <span className="font-semibold text-slate-900">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (_, row) => <MethodBadge method={row.method} />,
    },
    {
      key: 'date',
      label: 'Date',
      render: (_, row) => (
        <span className="text-slate-500 text-sm whitespace-nowrap">
          {new Date(row.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: 'id',
      label: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          {row.status === 'failed' && (
            <Button variant="ghost" size="sm" onClick={() => handleRetry(row)}>
              Retry
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Download invoice" onClick={() => handleDownloadInvoice(row)}>
            <Download className="h-4 w-4 text-slate-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Payments"
        subtitle="Track all subscription payments and invoices across the platform"
        actions={
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
          change={4.1}
          changeLabel="vs last month"
        />
        <StatCard
          label="Paid Invoices"
          value={totalPaid}
          icon={<CreditCard className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Pending"
          value={totalPending}
          icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Failed"
          value={totalFailed}
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <Card
        noPadding
        title="All Payments"
        subtitle={`${filtered.length} of ${payments.length} invoices`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search payments…"
              className="w-52"
            />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
              ]}
            />
            <Select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              options={[
                { value: '', label: 'All Plans' },
                { value: 'starter', label: 'Starter' },
                { value: 'basic', label: 'Basic' },
                { value: 'pro', label: 'Pro' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
            />
            {(search || filterStatus || filterPlan) && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStatus('');
                  setFilterPlan('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        }
      >
        <DataTable<SAPayment>
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage="No payments match your filters."
        />
      </Card>
    </div>
  );
}
