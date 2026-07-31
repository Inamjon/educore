import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TEACHER_EXAMS } from "@/lib/teacher-data";

export interface Exam {
  id: string;
  title: string;
  groupId: string;
  groupName: string;
  date: string;
  startTime: string;
  duration: number;
  room: string;
  totalStudents: number;
  status: "upcoming" | "completed";
  maxScore: number;
  questions: number;
  avgScore?: number;
  cancelled?: boolean;
}

export interface NewExam {
  title: string;
  groupId: string;
  groupName: string;
  date: string;
  startTime: string;
  duration: number;
  room: string;
  maxScore: number;
  totalStudents: number;
  questions: number;
}

interface TeacherExamsState {
  exams: Exam[];
  examResults: Record<string, Record<string, number>>;
  addExam: (input: NewExam) => void;
  updateExam: (id: string, patch: Partial<NewExam>) => void;
  cancelExam: (id: string) => void;
  saveResults: (examId: string, results: Record<string, number>) => void;
}

export const useTeacherExamsStore = create<TeacherExamsState>()(
  persist(
    (set) => ({
      exams: TEACHER_EXAMS as Exam[],
      examResults: {},

      addExam: (input) => {
        const exam: Exam = { ...input, id: `ex${Date.now()}`, status: "upcoming" };
        set((s) => ({ exams: [exam, ...s.exams] }));
      },

      updateExam: (id, patch) =>
        set((s) => ({ exams: s.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

      cancelExam: (id) =>
        set((s) => ({ exams: s.exams.map((e) => (e.id === id ? { ...e, cancelled: true } : e)) })),

      saveResults: (examId, results) => {
        const scores = Object.values(results).filter((v) => !isNaN(v) && v > 0);
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        set((s) => ({
          examResults: { ...s.examResults, [examId]: results },
          exams: s.exams.map((e) => (e.id === examId ? { ...e, avgScore } : e)),
        }));
      },
    }),
    { name: "educore-teacher-exams", version: 1 }
  )
);
