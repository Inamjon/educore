import { apiFetch } from "@/lib/api/client";
import type { Gender } from "@/lib/api/students";

export interface User {
  id: string;
  organization: string;
  login_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: Gender | null;
  date_of_birth: string | null;
  status: string;
}

export function getUser(userId: string): Promise<User> {
  return apiFetch<User>(`/api/v1/users/${userId}/`);
}
