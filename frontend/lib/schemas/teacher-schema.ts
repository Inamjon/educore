import { z } from "zod";

export const teacherSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Phone number is required"),
  gender: z.enum(["male", "female", "other"]),
  specialization: z.string().trim().min(1, "Specialization is required"),
  subjects: z.array(z.string().trim().min(1)).min(1, "Add at least one subject"),
  status: z.enum(["active", "inactive", "pending", "suspended"]),
  salary: z.coerce.number().min(0, "Salary must be a positive number"),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;
