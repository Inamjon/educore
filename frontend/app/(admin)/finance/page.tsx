"use client";
import { useMemo, useState } from "react";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useInvoicesStore } from "@/lib/store/invoices-store";
import { toast } from "@/lib/store/toast-store";
import { TRANSACTIONS } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/types";
import { FinanceRevenueChart } from "@/components/charts/finance-chart";
import { InvoiceFormDialog } from "./_components/invoice-form-dialog";
import { InvoiceDetailPanel } from "./_components/invoice-detail-panel";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
];

export default function FinancePage() {
  const invoiceItems = useInvoicesStore((s) => s.items);
  const invoices = useMemo(() => invoiceItems.filter((i) => !i.deletedAt), [invoiceItems]);
  const softDelete = useInvoicesStore((s) => s.softDelete);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  const filtered = invoices.filter((inv) => {
    const matchesSearch = !search || inv.studentName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedInvoice = invoices.find((i) => i.id === selectedId) ?? null;
  const totalRevenue = invoices.reduce((s, i) => s + i.paid, 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.balance, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.balance, 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  const INVOICE_COLUMNS: Column<Invoice>[] = [
    {
      key: "studentName",
      label: "Student",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.studentName} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{row.studentName}</p>
            <p className="text-xs text-slate-400">{row.groupName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (val) => <span className="font-medium text-slate-900">{formatCurrency(Number(val))}</span>,
    },
    {
      key: "paid",
      label: "Paid",
      render: (val) => <span className="text-emerald-600 font-medium">{formatCurrency(Number(val))}</span>,
    },
    {
      key: "balance",
      label: "Balance",
      render: (val) => (
        <span className={Number(val) > 0 ? "text-red-500 font-medium" : "text-slate-400"}>
          {Number(val) > 0 ? formatCurrency(Number(val)) : "—"}
        </span>
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (val) => formatDate(String(val)),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={String(val)} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        subtitle="Payments, invoices, and revenue"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <DollarSign className="h-4 w-4" />
            New Invoice
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={formatCurrency(totalRevenue)} change={14} changeLabel="vs last month" icon={<DollarSign className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Pending" value={formatCurrency(totalPending)} icon={<TrendingUp className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
        <StatCard label="Overdue" value={formatCurrency(totalOverdue)} icon={<AlertCircle className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Paid Invoices" value={`${paidCount}/${invoices.length}`} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Monthly Revenue" subtitle="Revenue vs Expenses">
          <FinanceRevenueChart />
        </Card>

        <Card title="Recent Transactions" subtitle="Latest payments">
          <div className="space-y-3">
            {TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3">
                <Avatar name={tx.studentName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{tx.studentName}</p>
                  <p className="text-xs text-slate-400 capitalize">{tx.method}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(tx.amount)}</p>
                  <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        noPadding
        title="Invoices"
        subtitle={`${filtered.length} invoices`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..." />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32" />
          </div>
        }
      >
        <DataTable columns={INVOICE_COLUMNS} data={filtered} keyField="id" emptyMessage="No invoices found" onRowClick={(row) => setSelectedId(row.id)} />
      </Card>

      {selectedInvoice && (
        <InvoiceDetailPanel
          invoice={selectedInvoice}
          onBack={() => setSelectedId(null)}
          onDelete={() => setDeletingInvoice(selectedInvoice)}
        />
      )}

      <InvoiceFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(null)}
        title="Delete invoice"
        description={`Are you sure you want to remove this invoice for ${deletingInvoice?.studentName}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingInvoice) {
            softDelete(deletingInvoice.id);
            toast.success("Invoice removed");
            if (selectedId === deletingInvoice.id) setSelectedId(null);
          }
        }}
      />
    </div>
  );
}
