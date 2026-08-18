import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAttendance,
  deleteAttendance,
  listAttendance,
  updateAttendance,
  type ListAttendanceParams,
  type MarkAttendanceInput,
} from "@/lib/api/attendance";
import { daysFromTodayIso } from "@/lib/utils";

const attendanceKey = (params: ListAttendanceParams) => ["attendance", params] as const;

export function useAttendanceQuery(params: ListAttendanceParams) {
  return useQuery({
    queryKey: attendanceKey(params),
    queryFn: () => listAttendance(params),
    enabled: !!params.organizationId,
  });
}

// A group's attendance is bounded by the group's own lifetime (a course
// typically runs weeks to months, not years — Groups get archived/replaced
// each term rather than accumulating forever) — see listAttendance's
// caller-contract comment. Fanning this out across *every* one of a
// teacher's groups at once, on every dashboard load, is a different problem
// though: N groups each paging through their own full history multiplies
// the request count, and the "Avg Attendance"/weekly-chart widgets this
// feeds only ever look at the last 7 days anyway (see app/teacher/page.tsx).
// Bounding to a rolling 30-day window here — not in listAttendance/
// useAttendanceQuery itself, which single-group pages still use for a
// real "full history" view — keeps the common dashboard-load path fast
// without changing what a teacher sees when they deliberately open one
// group's attendance history.
const DASHBOARD_WINDOW_DAYS = 30;

/** Aggregates attendance across several groups (e.g. all of a teacher's own
 * groups) — same fan-out-in-parallel shape as useMyRosterQuery, and shares
 * its per-group queryKey so the cache is reused. */
export function useAttendanceForGroupsQuery(organizationId: string, groupIds: string[]) {
  const dateFrom = daysFromTodayIso(-DASHBOARD_WINDOW_DAYS);
  const results = useQueries({
    queries: groupIds.map((groupId) => ({
      queryKey: attendanceKey({ organizationId, group: groupId, dateFrom }),
      queryFn: () => listAttendance({ organizationId, group: groupId, dateFrom }),
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
