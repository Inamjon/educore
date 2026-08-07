import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBranch,
  deleteBranch,
  listBranches,
  suspendBranch,
  updateBranch,
  type BranchInput,
  type ListBranchesParams,
} from "@/lib/api/branches";

export function useBranchesQuery(params: ListBranchesParams = {}) {
  return useQuery({
    queryKey: ["branches", params],
    queryFn: () => listBranches(params),
  });
}

export function useCreateBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BranchInput) => createBranch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useUpdateBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BranchInput> }) => updateBranch(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useSuspendBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspendBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useDeleteBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}
