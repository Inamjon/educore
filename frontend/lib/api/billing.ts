import { apiFetch } from "@/lib/api/client";

/** Platform <-> organization billing — EduCore selling a center a
 * subscription tier. Distinct from `lib/api/finance.ts` (a center billing
 * its own students) and `lib/api/payment-gateways.ts` (a student paying
 * that center online) — see backend/billing/models/subscription_plan.py's
 * docstring for the same three-concepts distinction on the server side.
 */

export type BillingCycle = "monthly" | "annual";

/** Lightweight shape embedded in `Organization.subscription_plan_detail` —
 * no `active_count` (that field runs an extra query per plan server-side;
 * fine for the Subscriptions page's own handful of plan rows, wasteful
 * nested inside every organization in a list). */
export interface SubscriptionPlanSummary {
  id: string;
  name: string;
  slug: string;
  price: string;
  billing_cycle: BillingCycle;
  max_branches: number;
  max_students: number;
  max_teachers: number;
}

export interface SubscriptionPlan extends SubscriptionPlanSummary {
  features: string[];
  is_active: boolean;
  display_order: number;
  active_count: number;
  created_at: string;
  updated_at: string | null;
}

interface ListResponse<T> {
  results: T[];
  pagination: { count: number; page: number; pages: number };
}

export interface ListSubscriptionPlansParams {
  isActive?: boolean;
  billingCycle?: BillingCycle;
  search?: string;
  pageSize?: number;
}

export async function listSubscriptionPlans(params: ListSubscriptionPlansParams = {}): Promise<SubscriptionPlan[]> {
  const query = new URLSearchParams();
  if (params.isActive !== undefined) query.set("is_active", String(params.isActive));
  if (params.billingCycle) query.set("billing_cycle", params.billingCycle);
  if (params.search) query.set("search", params.search);
  query.set("page_size", String(params.pageSize ?? 100));

  const data = await apiFetch<ListResponse<SubscriptionPlan>>(`/api/v1/billing/subscription-plans/?${query}`);
  return data.results;
}

export interface SubscriptionPlanInput {
  name: string;
  slug: string;
  price: number;
  billingCycle: BillingCycle;
  maxBranches: number;
  maxStudents: number;
  maxTeachers: number;
  features: string[];
  isActive?: boolean;
  displayOrder?: number;
}

function toBody(input: Partial<SubscriptionPlanInput>) {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.slug !== undefined) body.slug = input.slug;
  if (input.price !== undefined) body.price = input.price;
  if (input.billingCycle !== undefined) body.billing_cycle = input.billingCycle;
  if (input.maxBranches !== undefined) body.max_branches = input.maxBranches;
  if (input.maxStudents !== undefined) body.max_students = input.maxStudents;
  if (input.maxTeachers !== undefined) body.max_teachers = input.maxTeachers;
  if (input.features !== undefined) body.features = input.features;
  if (input.isActive !== undefined) body.is_active = input.isActive;
  if (input.displayOrder !== undefined) body.display_order = input.displayOrder;
  return body;
}

export async function createSubscriptionPlan(input: SubscriptionPlanInput): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>("/api/v1/billing/subscription-plans/", {
    method: "POST",
    body: JSON.stringify(toBody(input)),
  });
}

export async function updateSubscriptionPlan(id: string, input: Partial<SubscriptionPlanInput>): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(`/api/v1/billing/subscription-plans/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(toBody(input)),
  });
}

export async function deleteSubscriptionPlan(id: string): Promise<void> {
  await apiFetch(`/api/v1/billing/subscription-plans/${id}/`, { method: "DELETE" });
}
