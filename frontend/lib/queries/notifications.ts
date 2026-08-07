import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNotification,
  deleteNotification,
  listNotifications,
  markNotificationRead,
  type NotificationInput,
} from "@/lib/api/notifications";

export function useNotificationsQuery(params: { read?: boolean } = {}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => listNotifications(params),
  });
}

export function useCreateNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NotificationInput) => createNotification(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read?: boolean }) => markNotificationRead(id, read),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
