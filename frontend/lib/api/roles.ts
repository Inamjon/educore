import { apiFetch } from "@/lib/api/client";

export interface Role {
  id: string;
  organization: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
}

interface RoleListResponse {
  results: Role[];
}

/**
 * RoleViewSet has no filterset — fetch the (small, seeded) full list and
 * filter client-side. Roles rarely change, so callers can cache this
 * aggressively (see lib/queries/students.ts's long staleTime).
 */
export async function listRoles(): Promise<Role[]> {
  const data = await apiFetch<RoleListResponse>("/api/v1/roles/?page_size=100");
  return data.results;
}

export function findRoleBySlug(roles: Role[], organizationId: string, slug: string): Role | undefined {
  return roles.find((r) => r.organization === organizationId && r.slug === slug);
}
