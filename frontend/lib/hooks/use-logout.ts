import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";

export function useLogout() {
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);

  return async function handleLogout() {
    try {
      await logout();
    } finally {
      clearUser();
      router.push("/login");
    }
  };
}
