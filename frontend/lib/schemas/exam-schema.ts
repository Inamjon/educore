import { z } from "zod";

// Real-API form schema for the Admin "New/Edit Exam" dialog. Numeric fields
// stay strings in the form (matching Teacher Exams' FormValues shape) so an
// empty input isn't coerced to 0 mid-typing — parsed to a number only at
// submit time, same convention as everywhere else numeric text inputs are
// used in this codebase.
export const examSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  group: z.string().min(1, "Group is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.string().optional(),
  room: z.string().optional(),
  maxScore: z.string().optional(),
  questionCount: z.string().optional(),
});

export type ExamFormValues = z.infer<typeof examSchema>;
