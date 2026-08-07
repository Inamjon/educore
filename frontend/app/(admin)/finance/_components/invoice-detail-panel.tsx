"use client";

import { useState } from "react";
import { ChevronLeft, DollarSign, Calendar, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/lib/store/toast-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { usePaymentsQuery, useCreatePaymentMutation } from "@/lib/queries/finance";
import { recordPaymentSchema, type RecordPaymentFormValues } from "@/lib/schemas/invoice-profile-schema";
import { ApiError } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/lib/api/finance";

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "online", label: "Online" },
  { value: "mobile_payment", label: "Mobile Payment" },
  { value: "other", label: "Other" },
];

interface InvoiceDetailPanelProps {
  invoice: Invoice;
  onBack: () => void;
  onDelete: () => void;
}

const EMPTY_PAYMENT: RecordPaymentFormValues = { amount: 0, paymentMethod: "cash" };

export function InvoiceDetailPanel({ invoice, onBack, onDelete }: InvoiceDetailPanelProps) {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const { data: payments } = usePaymentsQuery({ organizationId: organizationId ?? "", invoice: invoice.id });
  const createPaymentMutation = useCreatePaymentMutation();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [values, setValues] = useState<RecordPaymentFormValues>(EMPTY_PAYMENT);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const balance = Number(invoice.balance);

  async function handleRecordPayment() {
    const result = recordPaymentSchema.safeParse(values);
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    if (!organizationId) return;

    setSubmitting(true);
    try {
      await createPaymentMutation.mutateAsync({
        organizationId,
        invoice: invoice.id,
        amount: result.data.amount,
        paymentMethod: result.data.paymentMethod,
      });
      toast.success("Payment recorded");
      setPaymentOpen(false);
      setValues(EMPTY_PAYMENT);
      setError(undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card noPadding>
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <p className="font-semibold text-slate-900">{invoice.student_name}</p>
          <p className="text-xs text-slate-500">{invoice.group_name ?? invoice.invoice_number}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={invoice.status} />
          {balance > 0 && (
            <Button variant="primary" size="sm" onClick={() => setPaymentOpen(true)}>
              <DollarSign className="h-3.5 w-3.5" />
              Record Payment
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Invoice Details</h4>
          <div className="space-y-3">
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Invoice #" value={invoice.invoice_number} />
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Amount" value={formatCurrency(Number(invoice.total_amount))} />
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Paid" value={formatCurrency(Number(invoice.paid_amount))} />
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Balance" value={formatCurrency(balance)} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Due Date" value={formatDate(invoice.due_date)} />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Payment History</h4>
          {!payments || payments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-700 capitalize">{p.payment_method.replace("_", " ")}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{formatDate(p.payment_date)}</span>
                    <span className="text-xs font-semibold text-emerald-600">+{formatCurrency(Number(p.amount))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Amount"
                value={values.amount}
                onChange={(e) => {
                  setValues((v) => ({ ...v, amount: Number(e.target.value) }));
                  setError(undefined);
                }}
                error={error}
              />
              <Select
                options={PAYMENT_METHOD_OPTIONS}
                value={values.paymentMethod}
                onChange={(e) => setValues((v) => ({ ...v, paymentMethod: e.target.value as RecordPaymentFormValues["paymentMethod"] }))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} loading={submitting}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-400 block">{label}</span>
        <span className="text-sm text-slate-700 font-medium">{value}</span>
      </div>
    </div>
  );
}
