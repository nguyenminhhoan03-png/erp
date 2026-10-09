import { clearToken, getToken } from "./auth-token";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api`;
  }
  return "http://127.0.0.1:8000/api";
}

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { Accept: "application/json" };

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  const baseUrl = getBaseUrl();
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? (isFormData ? (body as BodyInit) : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError("Không thể kết nối tới máy chủ. Vui lòng thử lại sau", 0);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearToken();
      if (typeof window !== "undefined") window.location.replace("/login");
    }
    throw new ApiError(
      payload?.message ?? "Đã có lỗi xảy ra",
      response.status,
      payload?.errors ?? {}
    );
  }

  return payload as T;
}
