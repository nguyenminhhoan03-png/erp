export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type ApiQuery = Record<string, ApiQueryValue | ApiQueryValue[]>;

export interface ApiClientResponse<T> {
  data: T | null;
  headers: Headers;
  ok: boolean;
  parseError?: string;
  rawBody: string;
  status: number;
  statusText: string;
  url: string;
}

export interface ApiRequestOptions<TBody = unknown> {
  baseUrl?: string;
  body?: TBody;
  cache?: RequestCache;
  headers?: HeadersInit;
  method?: HttpMethod;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
  query?: ApiQuery;
  timeoutMs?: number;
  auth?: boolean;
}

export type ApiFieldErrors = Record<string, string[]>;

export interface ApiError {
  code: string;
  details?: unknown;
  fieldErrors?: ApiFieldErrors;
  message: string;
  status: number;
}

export type ApiResult<T> =
  | {
      data: T;
      error: null;
      headers: Headers;
      status: number;
      type: "success";
      url: string;
    }
  | {
      data: unknown;
      error: ApiError;
      headers: Headers;
      status: number;
      type: "http-error";
      url: string;
    }
  | {
      data: unknown;
      error: ApiError;
      headers: Headers;
      status: 422;
      type: "validation-error";
      url: string;
    }
  | {
      error: ApiError;
      headers: Headers;
      rawBody: string;
      status: number;
      type: "decode-error";
      url: string;
    }
  | {
      data: unknown;
      error: ApiError;
      headers: Headers;
      status: number;
      type: "contract-error";
      url: string;
    }
  | {
      error: ApiError;
      status: 0;
      type: "network-error";
    };

export interface PaginationLink {
  active: boolean;
  label: string;
  url: string | null;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  next: string | null;
  prev: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links?: PaginationLink[];
  path?: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface CollectionResponse<T> {
  data: T[];
  links?: PaginationLinks;
  meta?: PaginationMeta;
  message?: string;
  success?: boolean;
}
