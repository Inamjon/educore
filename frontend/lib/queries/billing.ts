import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  listSubscriptionPlans,
  updateSubscriptionPlan,
  type ListSubscriptionPlansParams,
  type SubscriptionPlanInput,
} from "@/lib/api/billing";

export function useSubscriptionPlansQuery(params: ListSubscriptionPlansParams = {}) {
  return useQuery({
    queryKey: ["subscription-plans", params],
    queryFn: () => listSubscriptionPlans(params),
  });
}

export function useCreateSubscriptionPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscriptionPlanInput) => createSubscriptionPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
}

export function useUpdateSubscriptionPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SubscriptionPlanInput> }) => updateSubscriptionPlan(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      // A plan's name/limits can be embedded in an Organization's
      // `subscription_plan_detail` — refresh Centers too so it doesn't show
      // a stale nested snapshot after an edit.
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useDeleteSubscriptionPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubscriptionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });
}
