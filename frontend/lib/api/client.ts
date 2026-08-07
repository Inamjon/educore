const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Backend field-validation errors, e.g. `{"student_code": ["This field is required."]}`. */
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  /** Set only for genuine per-field serializer validation errors — null for
   * everything else (401/403/404, or a generic error string), matching
   * common/exceptions.py::envelope_exception_handler's data shape. */
  fieldErrors: FieldErrors | null;

  constructor(message: string, status: number, fieldErrors: FieldErrors | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function extractFieldErrors(data: unknown): FieldErrors | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data as FieldErrors;
}

// A 401 from either of these already IS the definitive answer (bad
// credentials / dead refresh token) — never worth a refresh-and-retry.
// Attempting one on a failed login would misreport "wrong password" as a
// silent extra round-trip at best; on a failed refresh it would recurse.
const AUTH_PATHS_EXEMPT_FROM_REFRESH = ["/api/v1/auth/login/", "/api/v1/auth/refresh/"];

// Shared across every in-flight 401 so concurrent requests (a page firing
// several queries at once) trigger exactly one refresh call, not one per
// request — every waiter awaits the same promise instead of racing.
let refreshPromise: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/v1/auth/refresh/`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function doFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

/**
 * Every call sends `credentials: "include"` — the backend's auth tokens
 * live in httpOnly cookies, never in JS-readable storage, so the browser
 * must be told to attach/accept them on every cross-port request.
 *
 * A 401 here almost always means the short-lived (15 min)
 * ACCESS_TOKEN_LIFETIME expired mid-session, not that the user is actually
 * signed out — the refresh token cookie easily outlives it (30 days). Left
 * unhandled, every query on a page left open past 15 minutes silently
 * fails and — worse — several call sites fall back to an empty array/list
 * on error, rendering a deceptively normal "0 records" state instead of an
 * auth error (see educore-frontend-architecture memory's "session-long
 * auth gotcha", hit for real multiple times across two verification
 * sessions). Rather than surface that as a hard error, refresh once and
 * retry the original request transparently; only if the refresh itself
 * fails (refresh token also expired/revoked) does the original 401 fall
 * through to the caller, same as before this existed.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiFetchWithRefresh<T>(path, init, false);
}

async function apiFetchWithRefresh<T>(path: string, init: RequestInit, isRetry: boolean): Promise<T> {
  const response = await doFetch(path, init);

  if (response.status === 401 && !isRetry && !AUTH_PATHS_EXEMPT_FROM_REFRESH.includes(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetchWithRefresh<T>(path, init, true);
    }
  }

  const body = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || !body || !body.success) {
    throw new ApiError(body?.message ?? "Request failed.", response.status, extractFieldErrors(body?.data));
  }

  return body.data;
}
