import { z } from "zod";

// Real-API form schema for the Admin Teachers page. Kept separate from
// lib/schemas/teacher-schema.ts, which still backs the mock Teacher type
// consumed by the Groups feature's teacher picker (see lib/store/teachers-store.ts).
export const teacherProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z.string().trim().min(7, "Phone number is required"),
  gender: z.enum(["male", "female", "other"]),
  teacherCode: z.string().trim().min(1, "Teacher code is required"),
  status: z.enum(["active", "inactive", "on_leave", "terminated", "pending"]),
  employmentType: z.enum(["full_time", "part_time", "contract", "freelance", "intern"]),
  specialization: z.string().trim().min(1, "Specialization is required"),
  salary: z.coerce.number().min(0, "Salary must be a positive number"),
});

export type TeacherProfileFormValues = z.infer<typeof teacherProfileSchema>;
