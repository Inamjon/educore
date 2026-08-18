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
  /** Backed by AuditLogFilter's `user` field — used by the Profile page's
   * "My Recent Actions" widget to scope the log to the logged-in user. */
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
}

// Deliberately does NOT paginate through every page like most of this
// file's siblings now do (see lib/api/client.ts::fetchAllPages) — audit
// logs are a genuinely unbounded, ever-growing event log (every audited
// action, forever), and this function is also used for a small bounded
// "recent N" widget (Profile page's pageSize: 6). Looping every page here
// would risk paging through an org's/platform's entire history. The
// Super-Admin Audit Logs page instead defaults its own date_from filter to
// a recent window — see that page for the actual bound.
export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<AuditLog[]> {
  const query = new URLSearchParams();
  if (params.organizationId) query.set("organization", params.organizationId);
  if (params.userId) query.set("user", params.userId);
  if (params.action) query.set("action", params.action);
  if (params.entityType) query.set("entity_type", params.entityType);
  if (params.dateFrom) query.set("date_from", params.dateFrom);
  if (params.dateTo) query.set("date_to", params.dateTo);
  query.set("page_size", String(params.pageSize ?? 100));

  const data = await apiFetch<ListResponse<AuditLog>>(`/api/v1/audit-logs/?${query}`);
  return data.results;
}
