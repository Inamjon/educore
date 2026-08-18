import { fetchAllPages } from "@/lib/api/client";

export interface Role {
  id: string;
  organization: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
}

/**
 * RoleViewSet has no filterset — fetch the full list and filter client-side.
 * Every org gets 3 org-scoped roles (center_admin/teacher/student) on
 * creation, so this grows with the platform's organization count, not a
 * small fixed number — worth paginating properly (not just a bigger
 * page_size) once the platform has more than ~30 organizations. Roles
 * rarely change, so callers can cache this aggressively (see
 * lib/queries/students.ts's long staleTime).
 */
export async function listRoles(): Promise<Role[]> {
  return fetchAllPages<Role>("/api/v1/roles/", new URLSearchParams());
}

export function findRoleBySlug(roles: Role[], organizationId: string, slug: string): Role | undefined {
  return roles.find((r) => r.organization === organizationId && r.slug === slug);
}
