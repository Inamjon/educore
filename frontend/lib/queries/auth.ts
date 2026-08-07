import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessions, revokeSession } from "@/lib/api/auth";

export function useSessionsQuery() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: getSessions,
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
