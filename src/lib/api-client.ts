import { apiRequest as baseApiRequest } from "./api/client";
import type { HttpMethod } from "./api/types";

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
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const res = await baseApiRequest<T>(path, {
    method,
    body,
    auth,
  });

  if (!res.ok) {
    const errorPayload = res.data as { message?: string; errors?: Record<string, string[]> } | null;
    throw new ApiError(
      errorPayload?.message ?? res.statusText ?? "Đã có lỗi xảy ra",
      res.status,
      errorPayload?.errors ?? {}
    );
  }

  return res.data as T;
}

export { apiClient } from "./api/client";
