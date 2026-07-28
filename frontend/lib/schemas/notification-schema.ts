import { z } from "zod";

export const notificationSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  message: z.string().trim().min(1, "Message is required"),
  type: z.enum(["info", "success", "warning", "error"]),
});

export type NotificationFormValues = z.infer<typeof notificationSchema>;
