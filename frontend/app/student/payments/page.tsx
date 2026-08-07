"use client";

import { useState } from "react";
import { DollarSign, AlertCircle, CheckCircle2, CreditCard, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store/auth-store";
import { useInvoicesQuery, usePaymentsQuery, useCreateSelfInvoiceMutation } from "@/lib/queries/finance";
import { useGatewayAccountsQuery, useInitiateCheckoutMutation } from "@/lib/queries/payment-gateways";
import { useGroupsQuery, useMyGroupMembershipsQuery } from "@/lib/queries/groups";
import { toast } from "@/lib/store/toast-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type { Invoice } from "@/lib/api/finance";
import type { Provider } from "@/lib/api/payment-gateways";

const PROVIDER_LABELS: Record<Provider, string> = { payme: "Payme", click: "Click" };

export default function StudentPaymentsPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const { data: invoicesData, isLoading } = useInvoicesQuery({ organizationId: organizationId ?? "" });
  const invoices = invoicesData ?? [];
  const { data: paymentsData } = usePaymentsQuery({ organizationId: organizationId ?? "" });
  const recentPayments = [...(paymentsData ?? [])]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 5);
  const { data: gatewayAccounts } = useGatewayAccountsQuery(organizationId ?? "");
  const availableProviders = (gatewayAccounts ?? []).filter((a) => a.is_active).map((a) => a.provider);
  const checkoutMutation = useInitiateCheckoutMutation();

  // Groups a center_admin has already added this student to, but never got
  // around to invoicing — the student can generate their own invoice for
  // one (never join a group themselves; that stays admin-only).
  const { data: myMemberships } = useMyGroupMembershipsQuery();
  const { data: allGroups } = useGroupsQuery({ organizationId: organizationId ?? "" });
  const invoicedGroupIds = new Set(invoices.map((i) => i.group).filter(Boolean));
  const groupsNeedingInvoice = (myMemberships ?? [])
    .filter((m) => m.status === "active" && !invoicedGroupIds.has(m.group))
    .map((m) => allGroups?.find((g) => g.id === m.group))
    .filter((g): g is NonNullable<typeof g> => !!g && g.price != null);
  const selfInvoiceMutation = useCreateSelfInvoiceMutation();

  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  async function handleGenerateInvoice(groupId: string) {
    try {
      await selfInvoiceMutation.mutateAsync(groupId);
      toast.success("Invoice created — find it below to pay.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  const totalDue = invoices.reduce((s, i) => s + Number(i.balance), 0);
  const overdue = invoices.filter((i) => i.status === "overdue");
  const totalOverdue = overdue.reduce((s, i) => s + Number(i.balance), 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  async function handlePay(provider: Provider) {
    if (!payingInvoice) return;
    setRedirecting(true);
    try {
      const result = await checkoutMutation.mutateAsync({
        invoiceId: payingInvoice.id,
        provider,
        returnUrl: `${window.location.origin}/student/payments`,
      });
      window.location.href = result.checkout_url;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setRedirecting(false);
    }
  }

  const COLUMNS: Column<Invoice>[] = [
    {
      key: "invoice_number",
      label: "Invoice",
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-900">{row.group_name ?? row.invoice_number}</p>
          <p className="text-xs text-slate-400">{row.invoice_number}</p>
        </div>
      ),
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (val) => <span className="font-medium text-slate-900">{formatCurrency(Number(val))}</span>,
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
      key: "due_date",
      label: "Due Date",
      render: (val) => formatDate(String(val)),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={String(val)} />,
    },
    {
      key: "id",
      label: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (_, row) =>
        Number(row.balance) > 0 && (
          <Button variant="primary" size="sm" onClick={() => setPayingInvoice(row)}>
            <CreditCard className="h-3.5 w-3.5" />
            Pay
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Your invoices and payment history" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Due" value={formatCurrency(totalDue)} icon={<DollarSign className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Overdue" value={formatCurrency(totalOverdue)} icon={<AlertCircle className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Paid Invoices" value={`${paidCount}/${invoices.length}`} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
      </div>

      {groupsNeedingInvoice.length > 0 && (
        <Card title="Groups awaiting an invoice" subtitle="Your center added you to these — generate an invoice to pay">
          <div className="space-y-2">
            {groupsNeedingInvoice.map((group) => (
              <div key={group.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{group.name}</p>
                    <p className="text-xs text-slate-400">{group.course_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(Number(group.price))}</span>
                  <Button
                    size="sm"
                    onClick={() => handleGenerateInvoice(group.id)}
                    loading={selfInvoiceMutation.isPending}
                  >
                    Generate Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card noPadding title="Invoices" subtitle={`${invoices.length} invoices`}>
        <DataTable
          columns={COLUMNS}
          data={invoices}
          keyField="id"
          emptyMessage={isLoading ? "Loading invoices…" : "No invoices yet."}
        />
      </Card>

      <Card title="Recent Payments" subtitle="Your last 5 transactions">
        <div className="space-y-3">
          {recentPayments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded yet.</p>
          ) : (
            recentPayments.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{tx.invoice_number}</p>
                  <p className="text-xs text-slate-400 capitalize">{tx.payment_method.replace("_", " ")}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(Number(tx.amount))}</p>
                  <p className="text-xs text-slate-400">{formatDate(tx.payment_date)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={!!payingInvoice} onOpenChange={(open) => !open && !redirecting && setPayingInvoice(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pay {payingInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {payingInvoice && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Balance: <span className="font-semibold text-slate-900">{formatCurrency(Number(payingInvoice.balance))}</span>
                </p>
                {availableProviders.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    This center hasn't set up online payments yet. Please contact them directly.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableProviders.map((provider) => (
                      <Button
                        key={provider}
                        className="w-full justify-center"
                        onClick={() => handlePay(provider)}
                        loading={redirecting}
                      >
                        Pay with {PROVIDER_LABELS[provider]}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingInvoice(null)} disabled={redirecting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
