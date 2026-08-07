import { apiFetch } from "@/lib/api/client";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  organization: string;
  recipient: string;
  sender: string | null;
  sender_name: string | null;
  title: string;
  message: string;
  type: NotificationType;
  category: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

interface ListResponse<T> {
  results: T[];
  pagination: { count: number; page: number; pages: number };
}

/**
 * Always the caller's own inbox — the backend scopes `NotificationViewSet`
 * to `recipient=request.user` unconditionally (see
 * backend/notifications/views.py), so there's no `organizationId`/
 * `recipient` param to pass here, unlike every other list* function in
 * `lib/api/*`.
 */
export async function listNotifications(params: { read?: boolean; pageSize?: number } = {}): Promise<Notification[]> {
  const query = new URLSearchParams();
  if (params.read !== undefined) query.set("read", String(params.read));
  query.set("page_size", String(params.pageSize ?? 100));

  const data = await apiFetch<ListResponse<Notification>>(`/api/v1/notifications/?${query}`);
  return data.results;
}

export interface NotificationInput {
  recipient: string;
  title: string;
  message: string;
  type?: NotificationType;
  category?: string;
}

export async function createNotification(input: NotificationInput): Promise<Notification> {
  return apiFetch<Notification>("/api/v1/notifications/", {
    method: "POST",
    body: JSON.stringify({
      recipient: input.recipient,
      title: input.title,
      message: input.message,
      type: input.type ?? "info",
      category: input.category ?? "",
    }),
  });
}

export async function markNotificationRead(id: string, read: boolean = true): Promise<Notification> {
  return apiFetch<Notification>(`/api/v1/notifications/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ read }),
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}/`, { method: "DELETE" });
}
