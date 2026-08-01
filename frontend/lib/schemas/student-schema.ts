import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(7, "Phone number is required"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().trim().min(1, "Address is required"),
  parentName: z.string().trim().min(1, "Parent name is required"),
  parentPhone: z.string().trim().min(7, "Parent phone is required"),
  status: z.enum(["active", "inactive", "pending", "suspended"]),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
