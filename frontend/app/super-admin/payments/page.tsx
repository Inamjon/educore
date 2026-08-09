'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  Clock,
  AlertCircle,
  Download,
  X,
  FileText,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { SearchInput, Select, Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useOrganizationsQuery } from '@/lib/queries/organizations';
import { useSubscriptionPlansQuery } from '@/lib/queries/billing';
import {
  usePlatformInvoicesQuery,
  useCreatePlatformInvoiceMutation,
  useDeletePlatformInvoiceMutation,
  usePlatformPaymentsQuery,
  useCreatePlatformPaymentMutation,
} from '@/lib/queries/billing';
import { toast } from '@/lib/store/toast-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ApiError } from '@/lib/api/client';
import type { PlatformInvoice, PlatformInvoiceStatus, PlatformPaymentMethod } from '@/lib/api/billing';

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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function InvoiceStatusBadge({ status }: { status: PlatformInvoiceStatus }) {
  const map: Record<PlatformInvoiceStatus, { label: string; className: string }> = {
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
    partially_paid: { label: 'Partially Paid', className: 'bg-amber-50 text-amber-700' },
    pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600' },
    overdue: { label: 'Overdue', className: 'bg-red-50 text-red-600' },
    cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-400' },
  };
  const cfg = map[status] ?? { label: status, className: 'bg-slate-50 text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}

const METHOD_OPTIONS: { value: PlatformPaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

// A billing_cycle-aware period-end default for the Create Invoice form —
// purely a starting suggestion, still editable before submit.
function addBillingCycle(dateStr: string, cycle: 'monthly' | 'annual'): string {
  const d = new Date(dateStr);
  if (cycle === 'annual') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyInvoiceForm = {
  organization: '',
  subscriptionPlan: '',
  amount: '',
  periodStart: todayIso(),
  periodEnd: addBillingCycle(todayIso(), 'monthly'),
  dueDate: addDays(todayIso(), 15),
  notes: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: invoicesData, isLoading, isError, error } = usePlatformInvoicesQuery({
    status: (filterStatus || undefined) as PlatformInvoiceStatus | undefined,
  });
  const invoices = invoicesData ?? [];
  const { data: paymentsData } = usePlatformPaymentsQuery();
  const payments = paymentsData ?? [];
  const recentPayments = [...payments].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 5);

  const { data: organizations } = useOrganizationsQuery();
  const { data: plans } = useSubscriptionPlansQuery();

  const createInvoiceMutation = useCreatePlatformInvoiceMutation();
  const deleteInvoiceMutation = useDeletePlatformInvoiceMutation();
  const createPaymentMutation = useCreatePlatformPaymentMutation();

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [payingInvoice, setPayingInvoice] = useState<PlatformInvoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'bank_transfer' as PlatformPaymentMethod, referenceNote: '' });
  const [deletingInvoice, setDeletingInvoice] = useState<PlatformInvoice | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const pendingCount = invoices.filter((i) => i.status === 'pending' || i.status === 'partially_paid').length;
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(
      (i) =>
        !q ||
        i.invoice_number.toLowerCase().includes(q) ||
        i.organization_name.toLowerCase().includes(q) ||
        i.plan_name.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const handleExportCsv = () => {
    downloadCsv('platform-invoices-export.csv', [
      ['Invoice', 'Center', 'Plan', 'Amount', 'Balance', 'Status', 'Due Date'],
      ...filtered.map((i) => [i.invoice_number, i.organization_name, i.plan_name, i.amount, i.balance, i.status, i.due_date]),
    ]);
    toast.success('Invoices exported');
  };

  // ── Create Invoice ────────────────────────────────────────────────────────
  function handleOrgOrPlanChange(field: 'organization' | 'subscriptionPlan', value: string) {
    setInvoiceForm((prev) => {
      const next = { ...prev, [field]: value };
      // Convenience: picking a plan pre-fills amount/period from it —
      // still fully editable before submit.
      if (field === 'subscriptionPlan') {
        const plan = plans?.find((p) => p.id === value);
        if (plan) {
          next.amount = plan.price;
          next.periodEnd = addBillingCycle(next.periodStart, plan.billing_cycle);
        }
      }
      // Picking an org that already has a plan assigned defaults the plan
      // picker to it too, one less click for the common case.
      if (field === 'organization' && !prev.subscriptionPlan) {
        const org = organizations?.find((o) => o.id === value);
        if (org?.subscription_plan) next.subscriptionPlan = org.subscription_plan;
      }
      return next;
    });
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceForm.organization || !invoiceForm.subscriptionPlan) {
      toast.error('Center and plan are required');
      return;
    }
    try {
      await createInvoiceMutation.mutateAsync({
        organization: invoiceForm.organization,
        subscriptionPlan: invoiceForm.subscriptionPlan,
        amount: Number(invoiceForm.amount) || 0,
        periodStart: invoiceForm.periodStart,
        periodEnd: invoiceForm.periodEnd,
        dueDate: invoiceForm.dueDate,
        notes: invoiceForm.notes || undefined,
      });
      toast.success('Invoice created');
      setShowInvoiceForm(false);
      setInvoiceForm(emptyInvoiceForm);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  // ── Record Payment ────────────────────────────────────────────────────────
  function openRecordPayment(invoice: PlatformInvoice) {
    setPayingInvoice(invoice);
    setPaymentForm({ amount: invoice.balance, method: 'bank_transfer', referenceNote: '' });
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payingInvoice) return;
    try {
      await createPaymentMutation.mutateAsync({
        platformInvoice: payingInvoice.id,
        amount: Number(paymentForm.amount) || 0,
        method: paymentForm.method,
        referenceNote: paymentForm.referenceNote || undefined,
      });
      toast.success('Payment recorded');
      setPayingInvoice(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<PlatformInvoice>[] = [
    {
      key: 'invoice_number',
      label: 'Invoice',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <span className="font-mono text-sm font-medium text-indigo-600">{row.invoice_number}</span>
        </div>
      ),
    },
    {
      key: 'organization_name',
      label: 'Center',
      render: (_, row) => <span className="font-medium text-slate-800">{row.organization_name}</span>,
    },
    {
      key: 'plan_name',
      label: 'Plan',
      render: (_, row) => <Badge label={row.plan_name} variant="secondary" />,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (_, row) => <span className="font-semibold text-slate-900">{formatCurrency(Number(row.amount))}</span>,
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (_, row) => (
        <span className={Number(row.balance) > 0 ? 'text-red-500 font-medium' : 'text-slate-400'}>
          {Number(row.balance) > 0 ? formatCurrency(Number(row.balance)) : '—'}
        </span>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (_, row) => <span className="text-slate-500 text-sm whitespace-nowrap">{formatDate(row.due_date)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <InvoiceStatusBadge status={row.status} />,
    },
    {
      key: 'id',
      label: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          {Number(row.balance) > 0 && row.status !== 'cancelled' && (
            <Button variant="ghost" size="sm" onClick={() => openRecordPayment(row)}>
              Record Payment
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Delete invoice" onClick={() => setDeletingInvoice(row)}>
            <Trash2 className="h-4 w-4 text-slate-400" />
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
        subtitle="Track subscription invoices and manually-confirmed payments across the platform"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setShowInvoiceForm(true)}>
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        }
      />

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Paid Invoices" value={paidCount} icon={<CreditCard className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Pending" value={pendingCount} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
        <StatCard label="Overdue" value={overdueCount} icon={<AlertCircle className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <Card
        noPadding
        title="Platform Invoices"
        subtitle={`${filtered.length} of ${invoices.length} invoices`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices…" className="w-52" />
            <Select
              value={filterStatus}
              placeholder="All Statuses"
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'partially_paid', label: 'Partially Paid' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            {(search || filterStatus) && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStatus('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : 'Failed to load invoices.'}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading invoices…
          </div>
        ) : (
          <DataTable<PlatformInvoice> columns={columns} data={filtered} keyField="id" emptyMessage="No invoices match your filters." />
        )}
      </Card>

      {/* ── Recent Payments ─────────────────────────────────────────────────── */}
      <Card title="Recent Payments" subtitle="Last 5 confirmed payments">
        <div className="space-y-3">
          {recentPayments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded yet.</p>
          ) : (
            recentPayments.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.organization_name}</p>
                  <p className="text-xs text-slate-400">
                    {p.invoice_number} · <span className="capitalize">{p.method.replace('_', ' ')}</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(Number(p.amount))}</p>
                  <p className="text-xs text-slate-400">{formatDate(p.payment_date)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ── Create Invoice Dialog ───────────────────────────────────────────── */}
      <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Platform Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice}>
            <DialogBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Center</label>
                  <Select
                    className="w-full"
                    value={invoiceForm.organization}
                    onChange={(e) => handleOrgOrPlanChange('organization', e.target.value)}
                    placeholder="Select a center"
                    options={(organizations ?? []).map((o) => ({ value: o.id, label: o.name }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Subscription Plan</label>
                  <Select
                    className="w-full"
                    value={invoiceForm.subscriptionPlan}
                    onChange={(e) => handleOrgOrPlanChange('subscriptionPlan', e.target.value)}
                    placeholder="Select a plan"
                    options={(plans ?? []).map((p) => ({ value: p.id, label: p.name }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Amount (USD)</label>
                  <Input
                    type="number"
                    min={0}
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Due Date</label>
                  <Input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Period Start</label>
                  <Input
                    type="date"
                    value={invoiceForm.periodStart}
                    onChange={(e) => setInvoiceForm((f) => ({ ...f, periodStart: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Period End</label>
                  <Input
                    type="date"
                    value={invoiceForm.periodEnd}
                    onChange={(e) => setInvoiceForm((f) => ({ ...f, periodEnd: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInvoiceForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createInvoiceMutation.isPending}>
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Record Payment Dialog ───────────────────────────────────────────── */}
      <Dialog open={!!payingInvoice} onOpenChange={(open) => !open && setPayingInvoice(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment — {payingInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment}>
            <DialogBody>
              {payingInvoice && (
                <>
                  <p className="text-sm text-slate-500">
                    Balance: <span className="font-semibold text-slate-900">{formatCurrency(Number(payingInvoice.balance))}</span>
                  </p>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Amount</label>
                    <Input
                      type="number"
                      min={0}
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Method</label>
                    <Select
                      className="w-full"
                      value={paymentForm.method}
                      options={METHOD_OPTIONS}
                      onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value as PlatformPaymentMethod }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Reference Note (optional)</label>
                    <Input
                      placeholder="e.g. wire #123, bank ref"
                      value={paymentForm.referenceNote}
                      onChange={(e) => setPaymentForm((f) => ({ ...f, referenceNote: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayingInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={createPaymentMutation.isPending}>
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(null)}
        title="Delete platform invoice"
        description={`Are you sure you want to delete invoice "${deletingInvoice?.invoice_number}"? This can be restored later if needed.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deletingInvoice) return;
          try {
            await deleteInvoiceMutation.mutateAsync(deletingInvoice.id);
            toast.success('Invoice deleted');
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
          } finally {
            setDeletingInvoice(null);
          }
        }}
      />
    </div>
  );
}
