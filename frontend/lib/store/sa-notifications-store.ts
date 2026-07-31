import { createEntityStore } from "./create-entity-store";
import { SA_NOTIFICATIONS, type SANotification as BaseSANotification } from "@/lib/super-admin-data";

export interface SANotification extends BaseSANotification {
  deletedAt?: string | null;
}

export const useSANotificationsStore = createEntityStore<SANotification>(
  "educore-sa-notifications",
  SA_NOTIFICATIONS as SANotification[],
  "san"
);

export function markAllSANotificationsRead() {
  useSANotificationsStore.setState((s) => ({
    items: s.items.map((n) => ({ ...n, read: true })),
  }));
}

export function markSANotificationRead(id: string) {
  useSANotificationsStore.getState().update(id, { read: true });
}
