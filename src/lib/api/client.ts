import { clearToken, getToken } from "@/lib/auth-token";
import { appendSearchParams } from "./query";
import { withApiResult } from "./result";
import type {
  ApiClientResponse,
  ApiQuery,
  ApiRequestOptions,
  ApiResult,
} from "./types";

const DEFAULT_TIMEOUT_MS = 15_000;

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api`;
  }
  return "http://127.0.0.1:8000/api";
}

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export const buildApiUrl = (
  path: string,
  query?: ApiQuery,
  customBaseUrl?: string,
): URL => {
  const base = (customBaseUrl || getBaseUrl()).replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(
    isAbsoluteUrl(path) ? path : `${base}/${normalizedPath}`,
  );
  return appendSearchParams(url, query);
};

const isNativeBody = (body: unknown): body is BodyInit =>
  typeof body === "string" ||
  body instanceof FormData ||
  body instanceof ReadableStream ||
  body instanceof URLSearchParams ||
  body instanceof Blob ||
  body instanceof ArrayBuffer;

const resolveBody = (body: unknown) => {
  if (body === null || body === undefined) {
    return undefined;
  }
  if (isNativeBody(body)) {
    return body;
  }
  return JSON.stringify(body);
};

const buildHeaders = (options: ApiRequestOptions) => {
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const auth = options.auth ?? true;
  if (auth) {
    const token = getToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (
    options.body !== null &&
    options.body !== undefined &&
    !isNativeBody(options.body) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
};

const readResponseBody = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return {
      data: null,
      rawBody: "",
    };
  }

  try {
    return {
      data: JSON.parse(text) as unknown,
      rawBody: text,
    };
  } catch {
    const jsonStart = text.search(/[\[{]/);
    if (jsonStart > -1) {
      try {
        return {
          data: JSON.parse(text.slice(jsonStart)) as unknown,
          rawBody: text,
        };
      } catch {
      }
    }
    return {
      data: null,
      parseError: "Response body is not valid JSON.",
      rawBody: text,
    };
  }
};

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<ApiClientResponse<TResponse>> {
  const method = options.method || "GET";
  const url = buildApiUrl(path, options.query, options.baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const resolvedBody = method === "GET" ? undefined : resolveBody(options.body);
    const requestInit: RequestInit & { duplex?: "half" } = {
      body: resolvedBody,
      cache: options.cache ?? "no-store",
      headers: buildHeaders(options),
      method,
      next: options.next,
      signal: controller.signal,
    };

    if (resolvedBody instanceof ReadableStream) {
      requestInit.duplex = "half";
    }

    const response = await fetch(url, requestInit);

    if (response.status === 401 && (options.auth ?? true)) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }

    const body = await readResponseBody(response);

    return {
      data: body.data as TResponse,
      headers: response.headers,
      ok: response.ok,
      parseError: body.parseError,
      rawBody: body.rawBody,
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  request: <TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
  ): Promise<ApiResult<TResponse>> =>
    withApiResult(() => apiRequest<TResponse, TBody>(path, options)),

  get: <TResponse>(
    path: string,
    options: Omit<ApiRequestOptions, "body" | "method"> = {},
  ): Promise<ApiResult<TResponse>> =>
    apiClient.request<TResponse>(path, {
      ...options,
      method: "GET",
    }),

  postJson: <TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options: Omit<ApiRequestOptions<TBody>, "body" | "method"> = {},
  ): Promise<ApiResult<TResponse>> =>
    apiClient.request<TResponse, TBody>(path, {
      ...options,
      body,
      method: "POST",
    }),

  postForm: <TResponse>(
    path: string,
    body: FormData,
    options: Omit<ApiRequestOptions<FormData>, "body" | "method"> = {},
  ): Promise<ApiResult<TResponse>> =>
    apiClient.request<TResponse, FormData>(path, {
      ...options,
      body,
      method: "POST",
    }),

  putJson: <TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options: Omit<ApiRequestOptions<TBody>, "body" | "method"> = {},
  ): Promise<ApiResult<TResponse>> =>
    apiClient.request<TResponse, TBody>(path, {
      ...options,
      body,
      method: "PUT",
    }),

  putForm: <TResponse>(
    path: string,
    body: FormData,
    options: Omit<ApiRequestOptions<FormData>, "body" | "method"> = {},
  ): Promise<ApiResult<TResponse>> =>
    apiClient.request<TResponse, FormData>(path, {
      ...options,
      body,
      method: "PUT",
    }),

  patchJson: <TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options: Omit<ApiRequestOptions<TBody>, "body" | "method"> = {},
  ): Promise<ApiResult<TResponse>> =>
    apiClient.request<TResponse, TBody>(path, {
      ...options,
      body,
      method: "PATCH",
    }),

  delete: <TResponse>(
    path: string,
    options: Omit<ApiRequestOptions, "body" | "method"> = {},
  ): Promise<ApiResult<TResponse>> =>
    apiClient.request<TResponse>(path, {
      ...options,
      method: "DELETE",
    }),
};
