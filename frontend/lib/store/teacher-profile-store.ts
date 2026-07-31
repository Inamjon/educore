import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TEACHER_PROFILE } from "@/lib/teacher-data";

export interface TeacherProfile {
  id: string;
  name: string;
  loginId: string;
  phone: string;
  subject: string;
  specialization: string;
  bio: string;
  joinedAt: string;
  avatar?: string;
  rating: number;
  totalStudents: number;
  totalGroups: number;
  yearsExperience: number;
}

interface TeacherProfileState {
  profile: TeacherProfile;
  update: (patch: Partial<TeacherProfile>) => void;
}

export const useTeacherProfileStore = create<TeacherProfileState>()(
  persist(
    (set) => ({
      profile: TEACHER_PROFILE,
      update: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
    }),
    { name: "educore-teacher-profile", version: 1 }
  )
);
