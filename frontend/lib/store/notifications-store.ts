import { createEntityStore } from "./create-entity-store";
import { NOTIFICATIONS } from "@/lib/data";
import type { Notification } from "@/types";

export const useNotificationsStore = createEntityStore<Notification>(
  "educore-admin-notifications",
  NOTIFICATIONS,
  "n"
);

export function markAllRead() {
  useNotificationsStore.setState((s) => ({
    items: s.items.map((n) => ({ ...n, read: true })),
  }));
}

export function markRead(id: string) {
  useNotificationsStore.getState().update(id, { read: true });
}
