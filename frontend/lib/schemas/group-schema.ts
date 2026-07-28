import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  courseId: z.string().min(1, "Course is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  room: z.string().trim().min(1, "Room is required"),
  days: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).min(1, "Select at least one day"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  status: z.enum(["active", "inactive", "pending", "suspended"]),
});

export type GroupFormValues = z.infer<typeof groupSchema>;
