"use client";

import { useState } from "react";
import { ChevronLeft, DollarSign, Calendar, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { useInvoicesStore } from "@/lib/store/invoices-store";
import { toast } from "@/lib/store/toast-store";
import { paymentSchema } from "@/lib/schemas/invoice-schema";
import { TRANSACTIONS } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/types";

interface InvoiceDetailPanelProps {
  invoice: Invoice;
  onBack: () => void;
  onDelete: () => void;
}

export function InvoiceDetailPanel({ invoice, onBack, onDelete }: InvoiceDetailPanelProps) {
  const updateInvoice = useInvoicesStore((s) => s.update);
  const payments = TRANSACTIONS.filter((t) => t.studentName === invoice.studentName);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | undefined>();

  function handleRecordPayment() {
    const result = paymentSchema.safeParse({ amount });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    const newPaid = invoice.paid + result.data.amount;
    const newBalance = Math.max(invoice.amount - newPaid, 0);
    updateInvoice(invoice.id, {
      paid: newPaid,
      balance: newBalance,
      status: newBalance === 0 ? "paid" : invoice.status,
    });
    toast.success("Payment recorded");
    setPaymentOpen(false);
    setAmount(0);
    setError(undefined);
  }

  return (
    <Card noPadding>
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <p className="font-semibold text-slate-900">{invoice.studentName}</p>
          <p className="text-xs text-slate-500">{invoice.groupName}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={invoice.status} />
          {invoice.balance > 0 && (
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
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Amount" value={formatCurrency(invoice.amount)} />
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Paid" value={formatCurrency(invoice.paid)} />
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Balance" value={formatCurrency(invoice.balance)} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Due Date" value={formatDate(invoice.dueDate)} />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Payment History</h4>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-700 capitalize">{p.method}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{formatDate(p.date)}</span>
                    <span className="text-xs font-semibold text-emerald-600">+{formatCurrency(p.amount)}</span>
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
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => {
                setAmount(Number(e.target.value));
                setError(undefined);
              }}
              error={error}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>Save</Button>
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
