import { z } from "zod";

// Real-API form schema for the Admin Courses page. Kept separate from
// lib/schemas/course-schema.ts, the mock-store schema — nothing else in the
// app depends on the mock Course store, so it (and this old schema) become
// dead code once this page is wired, unlike the Student/Teacher mock stores.
export const courseProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  category: z.string().trim().min(1, "Category is required"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  description: z.string().trim().min(1, "Description is required"),
  durationWeeks: z.coerce.number().min(1, "Duration must be at least 1 week"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  status: z.enum(["draft", "active", "archived", "discontinued"]),
  color: z.string().trim().min(1, "Color is required"),
});

export type CourseProfileFormValues = z.infer<typeof courseProfileSchema>;
