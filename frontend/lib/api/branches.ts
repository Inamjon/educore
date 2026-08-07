import { apiFetch } from "@/lib/api/client";

export interface Branch {
  id: string;
  organization: string;
  organization_name: string;
  name: string;
  code: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
  is_main: boolean;
  is_active: boolean;
  student_count: number;
  teacher_count: number;
  created_at: string;
  updated_at: string | null;
}

interface ListResponse<T> {
  results: T[];
  pagination: { count: number; page: number; pages: number };
}

export interface ListBranchesParams {
  organization?: string;
  isActive?: boolean;
  search?: string;
  pageSize?: number;
}

export async function listBranches(params: ListBranchesParams = {}): Promise<Branch[]> {
  const query = new URLSearchParams();
  if (params.organization) query.set("organization", params.organization);
  if (params.isActive !== undefined) query.set("is_active", String(params.isActive));
  if (params.search) query.set("search", params.search);
  query.set("page_size", String(params.pageSize ?? 100));

  const data = await apiFetch<ListResponse<Branch>>(`/api/v1/branches/?${query}`);
  return data.results;
}

export interface BranchInput {
  organization: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  city?: string;
}

function toBody(input: Partial<BranchInput>) {
  const body: Record<string, unknown> = {};
  if (input.organization !== undefined) body.organization = input.organization;
  if (input.name !== undefined) body.name = input.name;
  if (input.code !== undefined) body.code = input.code || null;
  if (input.phone !== undefined) body.phone = input.phone || null;
  if (input.email !== undefined) body.email = input.email || null;
  if (input.city !== undefined) body.city = input.city || null;
  return body;
}

export async function createBranch(input: BranchInput): Promise<Branch> {
  return apiFetch<Branch>("/api/v1/branches/", { method: "POST", body: JSON.stringify(toBody(input)) });
}

export async function updateBranch(id: string, input: Partial<BranchInput>): Promise<Branch> {
  return apiFetch<Branch>(`/api/v1/branches/${id}/`, { method: "PATCH", body: JSON.stringify(toBody(input)) });
}

export async function suspendBranch(id: string): Promise<Branch> {
  return apiFetch<Branch>(`/api/v1/branches/${id}/suspend/`, { method: "POST" });
}

export async function deleteBranch(id: string): Promise<void> {
  await apiFetch(`/api/v1/branches/${id}/`, { method: "DELETE" });
}
