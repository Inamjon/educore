const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Every call sends `credentials: "include"` — the backend's auth tokens
 * live in httpOnly cookies, never in JS-readable storage, so the browser
 * must be told to attach/accept them on every cross-port request.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || !body || !body.success) {
    throw new ApiError(body?.message ?? "Request failed.", response.status);
  }

  return body.data;
}
