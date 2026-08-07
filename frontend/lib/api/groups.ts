import { apiFetch } from "@/lib/api/client";
import type { CourseLevel } from "@/lib/api/courses";

export type GroupStatus = "forming" | "active" | "completed" | "cancelled" | "archived";
export type MemberStatus = "active" | "completed" | "dropped" | "transferred" | "suspended";
export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface Group {
  id: string;
  organization: string;
  branch: string | null;
  branch_name: string | null;
  course: string;
  course_name: string;
  course_level: CourseLevel;
  teacher: string;
  teacher_name: string;
  name: string;
  code: string;
  status: GroupStatus;
  max_students: number;
  enrolled_count: number;
  start_date: string;
  end_date: string | null;
  room: string | null;
  days_of_week: DayOfWeek[];
  start_time: string | null;
  end_time: string | null;
  price: string | null;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface GroupMember {
  id: string;
  organization: string;
  group: string;
  group_name: string;
  course_name: string;
  student_profile: string;
  student_name: string;
  student_login_id: string;
  student_phone: string;
  status: MemberStatus;
  completed_at: string | null;
  dropped_at: string | null;
  drop_reason: string | null;
  created_at: string;
}

interface ListResponse<T> {
  results: T[];
  pagination: { count: number; page: number; pages: number };
}

export interface ListGroupsParams {
  organizationId: string;
  course?: string;
  teacher?: string;
  status?: GroupStatus;
  search?: string;
  pageSize?: number;
}

export async function listGroups(params: ListGroupsParams): Promise<Group[]> {
  const query = new URLSearchParams({ organization: params.organizationId });
  if (params.course) query.set("course", params.course);
  if (params.teacher) query.set("teacher", params.teacher);
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  query.set("page_size", String(params.pageSize ?? 100));

  const data = await apiFetch<ListResponse<Group>>(`/api/v1/groups/?${query}`);
  return data.results;
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const query = new URLSearchParams({ group: groupId, page_size: "100" });
  const data = await apiFetch<ListResponse<GroupMember>>(`/api/v1/groups/members/?${query}`);
  return data.results;
}

export async function getStudentGroupMemberships(studentProfileId: string): Promise<GroupMember[]> {
  const query = new URLSearchParams({ student_profile: studentProfileId, page_size: "50" });
  const data = await apiFetch<ListResponse<GroupMember>>(`/api/v1/groups/members/?${query}`);
  return data.results;
}

export interface GroupInput {
  organizationId: string;
  course: string;
  teacher: string;
  name: string;
  status: GroupStatus;
  maxStudents: number;
  startDate: string;
  endDate?: string;
  room: string;
  daysOfWeek: DayOfWeek[];
  startTime: string;
  endTime: string;
  price: number;
}

export async function createGroup(input: GroupInput): Promise<Group> {
  return apiFetch<Group>("/api/v1/groups/", {
    method: "POST",
    body: JSON.stringify({
      organization: input.organizationId,
      course: input.course,
      teacher: input.teacher,
      name: input.name,
      status: input.status,
      max_students: input.maxStudents,
      start_date: input.startDate,
      end_date: input.endDate || null,
      room: input.room,
      days_of_week: input.daysOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      price: input.price,
    }),
  });
}

export async function updateGroup(groupId: string, input: Partial<GroupInput>): Promise<Group> {
  const patch: Record<string, unknown> = {};
  if (input.course !== undefined) patch.course = input.course;
  if (input.teacher !== undefined) patch.teacher = input.teacher;
  if (input.name !== undefined) patch.name = input.name;
  if (input.status !== undefined) patch.status = input.status;
  if (input.maxStudents !== undefined) patch.max_students = input.maxStudents;
  if (input.startDate !== undefined) patch.start_date = input.startDate;
  if (input.endDate !== undefined) patch.end_date = input.endDate || null;
  if (input.room !== undefined) patch.room = input.room;
  if (input.daysOfWeek !== undefined) patch.days_of_week = input.daysOfWeek;
  if (input.startTime !== undefined) patch.start_time = input.startTime;
  if (input.endTime !== undefined) patch.end_time = input.endTime;
  if (input.price !== undefined) patch.price = input.price;

  return apiFetch<Group>(`/api/v1/groups/${groupId}/`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await apiFetch(`/api/v1/groups/${groupId}/`, { method: "DELETE" });
}

export async function addGroupMember(organizationId: string, groupId: string, studentProfileId: string): Promise<GroupMember> {
  return apiFetch<GroupMember>("/api/v1/groups/members/", {
    method: "POST",
    body: JSON.stringify({ organization: organizationId, group: groupId, student_profile: studentProfileId }),
  });
}

export async function removeGroupMember(memberId: string): Promise<void> {
  await apiFetch(`/api/v1/groups/members/${memberId}/`, { method: "DELETE" });
}
