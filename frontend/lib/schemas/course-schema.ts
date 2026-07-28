import { z } from "zod";

export const courseSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  category: z.string().trim().min(1, "Category is required"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  description: z.string().trim().min(1, "Description is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 week"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  status: z.enum(["active", "inactive", "pending", "suspended"]),
  color: z.string().trim().min(1, "Color is required"),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
