import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/api/auth";

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
}

/**
 * Display/routing cache only — never holds a token. The httpOnly cookie the
 * backend sets is the real credential and the only thing actually enforcing
 * auth; this store just remembers who's shown as logged in between reloads.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: "educore-auth-user", version: 1 }
  )
);
