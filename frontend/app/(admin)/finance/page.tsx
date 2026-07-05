"use client";
import { useState } from "react";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { INVOICES, TRANSACTIONS } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/types";
import { FinanceRevenueChart } from "@/components/charts/finance-chart";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
];

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

export default function FinancePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = INVOICES.filter((inv) => {
    const matchesSearch = !search || inv.studentName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = INVOICES.reduce((s, i) => s + i.paid, 0);
  const totalPending = INVOICES.filter((i) => i.status === "pending").reduce((s, i) => s + i.balance, 0);
  const totalOverdue = INVOICES.filter((i) => i.status === "overdue").reduce((s, i) => s + i.balance, 0);
  const paidCount = INVOICES.filter((i) => i.status === "paid").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        subtitle="Payments, invoices, and revenue"
        actions={
          <Button>
            <DollarSign className="h-4 w-4" />
            New Invoice
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={formatCurrency(totalRevenue)} change={14} changeLabel="vs last month" icon={<DollarSign className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Pending" value={formatCurrency(totalPending)} icon={<TrendingUp className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
        <StatCard label="Overdue" value={formatCurrency(totalOverdue)} icon={<AlertCircle className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Paid Invoices" value={`${paidCount}/${INVOICES.length}`} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
      </div>

      {/* Chart + Recent Transactions */}
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

      {/* Invoices Table */}
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
        <DataTable columns={INVOICE_COLUMNS} data={filtered} keyField="id" emptyMessage="No invoices found" />
      </Card>
    </div>
  );
}
