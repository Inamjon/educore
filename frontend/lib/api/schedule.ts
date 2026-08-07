import { apiFetch } from "@/lib/api/client";

export type LessonStatus = "scheduled" | "completed" | "cancelled";

export interface Lesson {
  id: string;
  organization: string;
  group: string;
  group_name: string;
  course_name: string | null;
  course_color: string | null;
  teacher_id: string;
  teacher_name: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  topic: string | null;
  status: LessonStatus;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ListResponse<T> {
  results: T[];
  pagination: { count: number; page: number; pages: number };
}

export interface ListLessonsParams {
  organizationId: string;
  group?: string;
  status?: LessonStatus;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
}

export async function listLessons(params: ListLessonsParams): Promise<Lesson[]> {
  const query = new URLSearchParams({ organization: params.organizationId });
  if (params.group) query.set("group", params.group);
  if (params.status) query.set("status", params.status);
  if (params.date) query.set("date", params.date);
  if (params.dateFrom) query.set("date_from", params.dateFrom);
  if (params.dateTo) query.set("date_to", params.dateTo);
  query.set("page_size", String(params.pageSize ?? 200));

  const data = await apiFetch<ListResponse<Lesson>>(`/api/v1/schedule/lessons/?${query}`);
  return data.results;
}

export interface LessonInput {
  organizationId: string;
  group: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  topic?: string;
  status?: LessonStatus;
  notes?: string;
}

export async function createLesson(input: LessonInput): Promise<Lesson> {
  return apiFetch<Lesson>("/api/v1/schedule/lessons/", {
    method: "POST",
    body: JSON.stringify({
      organization: input.organizationId,
      group: input.group,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      room: input.room || null,
      topic: input.topic || null,
      status: input.status ?? "scheduled",
      notes: input.notes || null,
    }),
  });
}

export async function updateLesson(id: string, input: Partial<LessonInput>): Promise<Lesson> {
  const body: Record<string, unknown> = {};
  if (input.group !== undefined) body.group = input.group;
  if (input.date !== undefined) body.date = input.date;
  if (input.startTime !== undefined) body.start_time = input.startTime;
  if (input.endTime !== undefined) body.end_time = input.endTime;
  if (input.room !== undefined) body.room = input.room || null;
  if (input.topic !== undefined) body.topic = input.topic || null;
  if (input.status !== undefined) body.status = input.status;
  if (input.notes !== undefined) body.notes = input.notes || null;

  return apiFetch<Lesson>(`/api/v1/schedule/lessons/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteLesson(id: string): Promise<void> {
  await apiFetch(`/api/v1/schedule/lessons/${id}/`, { method: "DELETE" });
}
