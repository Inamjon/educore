import { createEntityStore } from "./create-entity-store";
import { TEACHER_STUDENTS } from "@/lib/teacher-data";

export interface TeacherStudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  groupId: string;
  groupName: string;
  attendanceRate: number;
  avgGrade: number;
  lastActive: string;
  status: "active" | "inactive";
  parentName: string;
  parentPhone: string;
  notes: string;
  deletedAt?: string | null;
}

export const useTeacherStudentsStore = createEntityStore<TeacherStudentRecord>(
  "educore-teacher-students",
  TEACHER_STUDENTS as TeacherStudentRecord[],
  "ts"
);
