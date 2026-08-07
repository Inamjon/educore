import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGatewayAccount,
  deleteGatewayAccount,
  initiateCheckout,
  listGatewayAccounts,
  updateGatewayAccount,
  type CheckoutInput,
  type GatewayAccountInput,
} from "@/lib/api/payment-gateways";

const gatewayAccountsKey = (organizationId: string) => ["gateway-accounts", organizationId] as const;

export function useGatewayAccountsQuery(organizationId: string) {
  return useQuery({
    queryKey: gatewayAccountsKey(organizationId),
    queryFn: () => listGatewayAccounts(organizationId),
    enabled: !!organizationId,
  });
}

export function useCreateGatewayAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GatewayAccountInput) => createGatewayAccount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-accounts"] });
    },
  });
}

export function useUpdateGatewayAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<GatewayAccountInput> }) => updateGatewayAccount(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-accounts"] });
    },
  });
}

export function useDeleteGatewayAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGatewayAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-accounts"] });
    },
  });
}

export function useInitiateCheckoutMutation() {
  return useMutation({
    mutationFn: (input: CheckoutInput) => initiateCheckout(input),
  });
}
