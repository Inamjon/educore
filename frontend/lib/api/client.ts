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
    throw new ApiError(body?.message ?? "Request failed.", response.status, extractFieldErrors(body?.data));
  }

  return body.data;
}
