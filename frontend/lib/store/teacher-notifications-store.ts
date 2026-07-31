import { createEntityStore } from "./create-entity-store";
import { TEACHER_NOTIFICATIONS } from "@/lib/teacher-data";

export interface TeacherNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  category: "message" | "assignment" | "exam" | "class" | "admin";
  deletedAt?: string | null;
}

export const useTeacherNotificationsStore = createEntityStore<TeacherNotification>(
  "educore-teacher-notifications",
  TEACHER_NOTIFICATIONS as TeacherNotification[],
  "tn"
);

export function markAllTeacherNotificationsRead() {
  useTeacherNotificationsStore.setState((s) => ({
    items: s.items.map((n) => ({ ...n, read: true })),
  }));
}

export function markTeacherNotificationRead(id: string) {
  useTeacherNotificationsStore.getState().update(id, { read: true });
}
