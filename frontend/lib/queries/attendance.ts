import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAttendance,
  deleteAttendance,
  listAttendance,
  updateAttendance,
  type ListAttendanceParams,
  type MarkAttendanceInput,
} from "@/lib/api/attendance";

const attendanceKey = (params: ListAttendanceParams) => ["attendance", params] as const;

export function useAttendanceQuery(params: ListAttendanceParams) {
  return useQuery({
    queryKey: attendanceKey(params),
    queryFn: () => listAttendance(params),
    enabled: !!params.organizationId,
  });
}

/** Aggregates attendance across several groups (e.g. all of a teacher's own
 * groups) — same fan-out-in-parallel shape as useMyRosterQuery, and shares
 * its per-group queryKey so the cache is reused. */
export function useAttendanceForGroupsQuery(organizationId: string, groupIds: string[]) {
  const results = useQueries({
    queries: groupIds.map((groupId) => ({
      queryKey: attendanceKey({ organizationId, group: groupId }),
      queryFn: () => listAttendance({ organizationId, group: groupId }),
      enabled: !!organizationId && !!groupId,
    })),
  });

  return {
    data: results.flatMap((r) => r.data ?? []),
    isLoading: results.some((r) => r.isLoading),
  };
}

export function useCreateAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkAttendanceInput) => createAttendance(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useUpdateAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attendanceId, input }: { attendanceId: string; input: Partial<Pick<MarkAttendanceInput, "status" | "notes">> }) =>
      updateAttendance(attendanceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useDeleteAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attendanceId: string) => deleteAttendance(attendanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
