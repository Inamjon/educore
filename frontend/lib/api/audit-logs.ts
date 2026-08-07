import { apiFetch } from "@/lib/api/client";

/** Mirrors backend/foundation/models/audit_log.py::AUDIT_ACTION_CHOICES. */
export type AuditAction = "create" | "read" | "update" | "delete" | "login" | "logout" | "export" | "import";

export interface AuditLog {
  id: string;
  organization: string | null;
  organization_name: string | null;
  user: string | null;
  user_name: string | null;
  user_login_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ListResponse<T> {
  results: T[];
  pagination: { count: number; page: number; pages: number };
}

export interface ListAuditLogsParams {
  organizationId?: string;
  action?: AuditAction;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<AuditLog[]> {
  const query = new URLSearchParams();
  if (params.organizationId) query.set("organization", params.organizationId);
  if (params.action) query.set("action", params.action);
  if (params.entityType) query.set("entity_type", params.entityType);
  if (params.dateFrom) query.set("date_from", params.dateFrom);
  if (params.dateTo) query.set("date_to", params.dateTo);
  query.set("page_size", String(params.pageSize ?? 100));

  const data = await apiFetch<ListResponse<AuditLog>>(`/api/v1/audit-logs/?${query}`);
  return data.results;
}
