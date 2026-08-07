import { apiFetch } from "@/lib/api/client";

export type Provider = "payme" | "click";

export interface PaymentGatewayAccount {
  id: string;
  organization: string;
  provider: Provider;
  merchant_id: string;
  service_id: string | null;
  has_secret_key: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface ListResponse<T> {
  results: T[];
  pagination: { count: number; page: number; pages: number };
}

export async function listGatewayAccounts(organizationId: string): Promise<PaymentGatewayAccount[]> {
  const query = new URLSearchParams({ organization: organizationId, page_size: "20" });
  const data = await apiFetch<ListResponse<PaymentGatewayAccount>>(`/api/v1/payment-gateways/gateway-accounts/?${query}`);
  return data.results;
}

export interface GatewayAccountInput {
  organizationId: string;
  provider: Provider;
  merchantId: string;
  serviceId?: string;
  secretKey?: string;
  isActive: boolean;
}

export async function createGatewayAccount(input: GatewayAccountInput): Promise<PaymentGatewayAccount> {
  return apiFetch<PaymentGatewayAccount>("/api/v1/payment-gateways/gateway-accounts/", {
    method: "POST",
    body: JSON.stringify({
      organization: input.organizationId,
      provider: input.provider,
      merchant_id: input.merchantId,
      service_id: input.serviceId || null,
      secret_key: input.secretKey || "",
      is_active: input.isActive,
    }),
  });
}

export async function updateGatewayAccount(id: string, input: Partial<GatewayAccountInput>): Promise<PaymentGatewayAccount> {
  return apiFetch<PaymentGatewayAccount>(`/api/v1/payment-gateways/gateway-accounts/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({
      ...(input.merchantId !== undefined && { merchant_id: input.merchantId }),
      ...(input.serviceId !== undefined && { service_id: input.serviceId || null }),
      ...(input.secretKey && { secret_key: input.secretKey }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    }),
  });
}

export async function deleteGatewayAccount(id: string): Promise<void> {
  await apiFetch(`/api/v1/payment-gateways/gateway-accounts/${id}/`, { method: "DELETE" });
}

export interface CheckoutInput {
  invoiceId: string;
  provider: Provider;
  returnUrl?: string;
}

export interface CheckoutResult {
  checkout_url: string;
  merchant_trans_id: string;
  gateway_transaction_id: string;
}

/** Backend-side ownership check (payment_gateways.views.CheckoutInitiateView)
 * lets this be called by either a center_admin (any invoice in their org)
 * or a student (their own invoice only) — see finance/tests/test_finance_authorization.py. */
export async function initiateCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  return apiFetch<CheckoutResult>("/api/v1/payment-gateways/checkout/", {
    method: "POST",
    body: JSON.stringify({
      invoice: input.invoiceId,
      provider: input.provider,
      return_url: input.returnUrl,
    }),
  });
}
