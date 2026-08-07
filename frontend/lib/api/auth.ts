import { apiFetch } from "@/lib/api/client";

export interface AuthUser {
  id: string;
  loginId: string;
  fullName: string;
  organizationId: string;
  status: string;
  role: string | null;
}

interface LoginResponseUser {
  id: string;
  login_id: string;
  full_name: string;
  organization_id: string;
  status: string;
  role: string | null;
}

function toAuthUser(u: LoginResponseUser): AuthUser {
  return {
    id: u.id,
    loginId: u.login_id,
    fullName: u.full_name,
    organizationId: u.organization_id,
    status: u.status,
    role: u.role,
  };
}

export async function login(loginId: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ user: LoginResponseUser }>("/api/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify({ login_id: loginId, password }),
  });
  return toAuthUser(data.user);
}

export async function logout(): Promise<void> {
  await apiFetch<null>("/api/v1/auth/logout/", { method: "POST" });
}

export async function refreshSession(): Promise<void> {
  await apiFetch<null>("/api/v1/auth/refresh/", { method: "POST" });
}

export interface Session {
  id: string;
  device_type: string;
  device_name: string;
  ip_address: string | null;
  location: string | null;
  last_activity_at: string;
  created_at: string;
  current: boolean;
}

export async function getSessions(): Promise<Session[]> {
  return apiFetch<Session[]>("/api/v1/auth/sessions/");
}

/** Backend rejects revoking the caller's own current session with a 400
 * ("use logout instead") — see auth_custom/views.py::SessionRevokeView. */
export async function revokeSession(sessionId: string): Promise<void> {
  await apiFetch<null>(`/api/v1/auth/sessions/${sessionId}/revoke/`, { method: "POST" });
}
