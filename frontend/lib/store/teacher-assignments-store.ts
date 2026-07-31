import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TEACHER_ASSIGNMENTS, TEACHER_SUBMISSIONS } from "@/lib/teacher-data";

export type Assignment = (typeof TEACHER_ASSIGNMENTS)[number];

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  score?: number;
  maxScore: number;
  status: "submitted" | "late";
  feedback?: string;
}

export type NewAssignment = Omit<
  Assignment,
  "id" | "createdAt" | "submitted" | "pending" | "late" | "status"
>;

interface TeacherAssignmentsState {
  assignments: Assignment[];
  submissions: Submission[];
  addAssignment: (input: NewAssignment) => void;
  updateAssignment: (id: string, patch: Partial<NewAssignment>) => void;
  gradeSubmission: (submissionId: string, patch: { score: number; feedback?: string }) => void;
}

export const useTeacherAssignmentsStore = create<TeacherAssignmentsState>()(
  persist(
    (set) => ({
      assignments: TEACHER_ASSIGNMENTS,
      submissions: TEACHER_SUBMISSIONS as Submission[],

      addAssignment: (input) => {
        const assignment: Assignment = {
          ...input,
          id: `asgn${Date.now()}`,
          createdAt: new Date().toISOString().split("T")[0],
          submitted: 0,
          pending: input.totalStudents,
          late: 0,
          status: "active",
        };
        set((s) => ({ assignments: [assignment, ...s.assignments] }));
      },

      updateAssignment: (id, patch) =>
        set((s) => ({
          assignments: s.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      gradeSubmission: (submissionId, patch) =>
        set((s) => ({
          submissions: s.submissions.map((sub) =>
            sub.id === submissionId ? { ...sub, ...patch } : sub
          ),
        })),
    }),
    { name: "educore-teacher-assignments", version: 1 }
  )
);
