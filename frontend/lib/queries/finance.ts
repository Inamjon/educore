import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvoice,
  createPayment,
  createSelfInvoice,
  deleteInvoice,
  listInvoices,
  listPayments,
  type InvoiceInput,
  type ListInvoicesParams,
  type ListPaymentsParams,
  type PaymentInput,
} from "@/lib/api/finance";

const invoicesKey = (params: ListInvoicesParams) => ["invoices", params] as const;
const paymentsKey = (params: ListPaymentsParams) => ["payments", params] as const;

export function useInvoicesQuery(params: ListInvoicesParams) {
  return useQuery({
    queryKey: invoicesKey(params),
    queryFn: () => listInvoices(params),
    enabled: !!params.organizationId,
  });
}

export function usePaymentsQuery(params: ListPaymentsParams) {
  return useQuery({
    queryKey: paymentsKey(params),
    queryFn: () => listPayments(params),
    enabled: !!params.organizationId,
  });
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InvoiceInput) => createInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useDeleteInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => deleteInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useCreateSelfInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => createSelfInvoice(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentInput) => createPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
