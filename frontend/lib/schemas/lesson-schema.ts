import { z } from "zod";

// Real-API form schema for Admin/Teacher "New Lesson" dialogs.
export const lessonSchema = z.object({
  group: z.string().min(1, "Group is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  room: z.string().optional(),
  topic: z.string().optional(),
});

export type LessonFormValues = z.infer<typeof lessonSchema>;
