import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z.string().trim().min(7, "Phone number is required"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  studentCode: z.string().trim().min(1, "Student code is required"),
  status: z.enum(["active", "inactive", "graduated", "expelled", "transferred", "on_leave", "pending"]),
  parentName: z.string().trim().min(1, "Parent name is required"),
  parentPhone: z.string().trim().min(7, "Parent phone is required"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
