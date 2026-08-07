"use client";

import { useState } from "react";
import { Save, Trash2, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  useGatewayAccountsQuery,
  useCreateGatewayAccountMutation,
  useUpdateGatewayAccountMutation,
  useDeleteGatewayAccountMutation,
} from "@/lib/queries/payment-gateways";
import { ToggleSwitch } from "../page";
import { toast } from "@/lib/store/toast-store";
import { ApiError } from "@/lib/api/client";
import type { PaymentGatewayAccount, Provider } from "@/lib/api/payment-gateways";

const PROVIDERS: { id: Provider; label: string; needsServiceId: boolean }[] = [
  { id: "payme", label: "Payme", needsServiceId: false },
  { id: "click", label: "Click", needsServiceId: true },
];

interface FormState {
  merchantId: string;
  serviceId: string;
  secretKey: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { merchantId: "", serviceId: "", secretKey: "", isActive: true };

function ProviderCard({ provider, label, needsServiceId, account }: {
  provider: Provider;
  label: string;
  needsServiceId: boolean;
  account?: PaymentGatewayAccount;
}) {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const createMutation = useCreateGatewayAccountMutation();
  const updateMutation = useUpdateGatewayAccountMutation();
  const deleteMutation = useDeleteGatewayAccountMutation();

  const [form, setForm] = useState<FormState>(
    account
      ? { merchantId: account.merchant_id, serviceId: account.service_id ?? "", secretKey: "", isActive: account.is_active }
      : EMPTY_FORM
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const saving = createMutation.isPending || updateMutation.isPending;

  async function handleSave() {
    if (!organizationId) return;
    if (!form.merchantId.trim()) {
      toast.error("Merchant ID is required.");
      return;
    }
    if (needsServiceId && !form.serviceId.trim()) {
      toast.error("Service ID is required for Click.");
      return;
    }
    if (!account && !form.secretKey.trim()) {
      toast.error("Secret key is required.");
      return;
    }

    try {
      if (account) {
        await updateMutation.mutateAsync({
          id: account.id,
          input: { merchantId: form.merchantId, serviceId: form.serviceId, secretKey: form.secretKey, isActive: form.isActive },
        });
      } else {
        await createMutation.mutateAsync({
          organizationId,
          provider,
          merchantId: form.merchantId,
          serviceId: form.serviceId,
          secretKey: form.secretKey,
          isActive: form.isActive,
        });
      }
      setForm((f) => ({ ...f, secretKey: "" }));
      toast.success(`${label} settings saved`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Card title={label} subtitle={account ? (account.is_active ? "Active" : "Disabled") : "Not configured"}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Merchant ID</label>
            <Input value={form.merchantId} onChange={(e) => setForm({ ...form, merchantId: e.target.value })} placeholder="Merchant ID" />
          </div>
          {needsServiceId && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Service ID</label>
              <Input value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} placeholder="Service ID" />
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Secret Key</label>
          <Input
            type="password"
            value={form.secretKey}
            onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
            placeholder={account?.has_secret_key ? "•••••••• (configured — leave blank to keep)" : "Enter secret key"}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-slate-900">Accept online payments</p>
            <p className="text-xs text-slate-400">Students can pay via {label} when enabled</p>
          </div>
          <ToggleSwitch enabled={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          {account && (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Remove ${label}`}
        description={`Students will no longer be able to pay via ${label}. This can be reconfigured later.`}
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!account) return;
          try {
            await deleteMutation.mutateAsync(account.id);
            setForm(EMPTY_FORM);
            toast.success(`${label} removed`);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
          }
        }}
      />
    </Card>
  );
}

export function PaymentGatewaysTab() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const { data: accounts, isLoading } = useGatewayAccountsQuery(organizationId ?? "");

  if (isLoading) {
    return (
      <Card title="Payment Gateways" subtitle="Connect Payme and Click so students can pay online">
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <CreditCard className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Loading…</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {PROVIDERS.map(({ id, label, needsServiceId }) => (
        <ProviderCard
          key={id}
          provider={id}
          label={label}
          needsServiceId={needsServiceId}
          account={accounts?.find((a) => a.provider === id)}
        />
      ))}
    </div>
  );
}
