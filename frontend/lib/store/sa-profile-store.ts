import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SA_PROFILE } from "@/lib/super-admin-data";

export interface SAProfile {
  name: string;
  loginId: string;
  phone: string;
  role: string;
  joinedAt: string;
  lastLogin: string;
  avatar?: string;
}

interface SAProfileState {
  profile: SAProfile;
  update: (patch: Partial<SAProfile>) => void;
}

export const useSAProfileStore = create<SAProfileState>()(
  persist(
    (set) => ({
      profile: SA_PROFILE,
      update: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
    }),
    { name: "educore-sa-profile", version: 1 }
  )
);
