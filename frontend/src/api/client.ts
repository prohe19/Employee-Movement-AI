const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** When true, body is a FormData and Content-Type is left for the browser. */
  formData?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData = false } = options;

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (formData && body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
    credentials: "include",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && (data as { error: string }).error) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, (data as { details?: unknown })?.details);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  upload: <T>(path: string, form: FormData) =>
    apiRequest<T>(path, { method: "POST", body: form, formData: true }),
};
