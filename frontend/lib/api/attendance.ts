import { apiFetch, fetchAllPages } from "@/lib/api/client";

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "early_leave" | "sick";

export interface AttendanceRecord {
  id: string;
  organization: string;
  group: string;
  group_name: string;
  course_name: string;
  student_profile: string;
  student_name: string;
  student_login_id: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  marked_by: string | null;
  marked_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ListAttendanceParams {
  organizationId: string;
  group?: string;
  studentProfile?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AttendanceStatus;
}

// Unscoped (no group/studentProfile) callers are responsible for their own
// date bound — this is a per-session record that accumulates without limit
// over an org's lifetime, so an unbounded org-wide call risks paging through
// years of history. See app/(admin)/attendance/page.tsx's default date
// filter for the one such caller in this app.
export async function listAttendance(params: ListAttendanceParams): Promise<AttendanceRecord[]> {
  const query = new URLSearchParams({ organization: params.organizationId });
  if (params.group) query.set("group", params.group);
  if (params.studentProfile) query.set("student_profile", params.studentProfile);
  if (params.date) query.set("date", params.date);
  if (params.dateFrom) query.set("date_from", params.dateFrom);
  if (params.dateTo) query.set("date_to", params.dateTo);
  if (params.status) query.set("status", params.status);

  return fetchAllPages<AttendanceRecord>("/api/v1/attendance/", query);
}

export interface MarkAttendanceInput {
  organizationId: string;
  group: string;
  studentProfile: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export async function createAttendance(input: MarkAttendanceInput): Promise<AttendanceRecord> {
  return apiFetch<AttendanceRecord>("/api/v1/attendance/", {
    method: "POST",
    body: JSON.stringify({
      organization: input.organizationId,
      group: input.group,
      student_profile: input.studentProfile,
      date: input.date,
      status: input.status,
      notes: input.notes || null,
    }),
  });
}

export async function updateAttendance(
  attendanceId: string,
  input: Partial<Pick<MarkAttendanceInput, "status" | "notes">>
): Promise<AttendanceRecord> {
  const patch: Record<string, unknown> = {};
  if (input.status !== undefined) patch.status = input.status;
  if (input.notes !== undefined) patch.notes = input.notes || null;

  return apiFetch<AttendanceRecord>(`/api/v1/attendance/${attendanceId}/`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteAttendance(attendanceId: string): Promise<void> {
  await apiFetch(`/api/v1/attendance/${attendanceId}/`, { method: "DELETE" });
}
