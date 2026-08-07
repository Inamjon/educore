import { apiFetch } from "@/lib/api/client";

export type AssignmentStatus = "active" | "closed";

export interface Assignment {
  id: string;
  organization: string;
  group: string;
  group_name: string;
  title: string;
  description: string | null;
  due_date: string;
  max_score: number;
  status: AssignmentStatus;
  created_by: string | null;
  total_students: number;
  submitted_count: number;
  graded_count: number;
  created_at: string;
  updated_at: string | null;
}

export interface Submission {
  id: string;
  organization: string;
  assignment: string;
  assignment_title: string;
  student_profile: string;
  student_name: string;
  content: string | null;
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  is_late: boolean;
  created_at: string;
}

interface ListResponse<T> {
  results: T[];
  pagination: { count: number; page: number; pages: number };
}

export interface ListAssignmentsParams {
  organizationId: string;
  group?: string;
  status?: AssignmentStatus;
  pageSize?: number;
}

export async function listAssignments(params: ListAssignmentsParams): Promise<Assignment[]> {
  const query = new URLSearchParams({ organization: params.organizationId });
  if (params.group) query.set("group", params.group);
  if (params.status) query.set("status", params.status);
  query.set("page_size", String(params.pageSize ?? 100));

  const data = await apiFetch<ListResponse<Assignment>>(`/api/v1/homework/assignments/?${query}`);
  return data.results;
}

export interface AssignmentInput {
  organizationId: string;
  group: string;
  title: string;
  description?: string;
  dueDate: string;
  maxScore?: number;
  status?: AssignmentStatus;
}

export async function createAssignment(input: AssignmentInput): Promise<Assignment> {
  return apiFetch<Assignment>("/api/v1/homework/assignments/", {
    method: "POST",
    body: JSON.stringify({
      organization: input.organizationId,
      group: input.group,
      title: input.title,
      description: input.description || null,
      due_date: input.dueDate,
      max_score: input.maxScore ?? 100,
      status: input.status ?? "active",
    }),
  });
}

export async function updateAssignment(id: string, input: Partial<AssignmentInput>): Promise<Assignment> {
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.title = input.title;
  if (input.description !== undefined) body.description = input.description || null;
  if (input.dueDate !== undefined) body.due_date = input.dueDate;
  if (input.maxScore !== undefined) body.max_score = input.maxScore;
  if (input.status !== undefined) body.status = input.status;

  return apiFetch<Assignment>(`/api/v1/homework/assignments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAssignment(id: string): Promise<void> {
  await apiFetch(`/api/v1/homework/assignments/${id}/`, { method: "DELETE" });
}

export interface ListSubmissionsParams {
  organizationId: string;
  assignment?: string;
  studentProfile?: string;
  pageSize?: number;
}

export async function listSubmissions(params: ListSubmissionsParams): Promise<Submission[]> {
  const query = new URLSearchParams({ organization: params.organizationId });
  if (params.assignment) query.set("assignment", params.assignment);
  if (params.studentProfile) query.set("student_profile", params.studentProfile);
  query.set("page_size", String(params.pageSize ?? 100));

  const data = await apiFetch<ListResponse<Submission>>(`/api/v1/homework/submissions/?${query}`);
  return data.results;
}

/** Student submitting their own homework — `student_profile` is ignored
 * server-side and forced to the caller's own profile regardless of what's
 * sent (see backend/homework/views.py::SubmissionViewSet.perform_create),
 * so it's not even collected here. */
export interface SubmissionInput {
  organizationId: string;
  assignment: string;
  content?: string;
}

export async function createSubmission(input: SubmissionInput): Promise<Submission> {
  return apiFetch<Submission>("/api/v1/homework/submissions/", {
    method: "POST",
    body: JSON.stringify({
      organization: input.organizationId,
      assignment: input.assignment,
      content: input.content || null,
    }),
  });
}

/** Teacher grading a submission. */
export async function gradeSubmission(id: string, input: { score: number; feedback?: string }): Promise<Submission> {
  return apiFetch<Submission>(`/api/v1/homework/submissions/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ score: input.score, feedback: input.feedback || null }),
  });
}
