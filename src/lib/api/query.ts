import type { ApiQuery, ApiQueryValue } from "./types";

const isPresent = (value: ApiQueryValue): value is Exclude<ApiQueryValue, null | undefined> =>
  value !== null && value !== undefined && value !== "";

export const appendSearchParams = (url: URL, query?: ApiQuery): URL => {
  if (!query) return url;

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.filter(isPresent).forEach((item) => {
        url.searchParams.append(key, String(item));
      });
      return;
    }

    if (isPresent(value)) {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
};

export const searchParamsToQuery = (
  searchParams: URLSearchParams,
  allowedKeys?: readonly string[],
): ApiQuery => {
  const allowed = allowedKeys ? new Set(allowedKeys) : null;
  const query: ApiQuery = {};

  searchParams.forEach((value, key) => {
    if (allowed && !allowed.has(key)) return;

    const existing = query[key];
    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }

    if (existing !== undefined) {
      query[key] = [existing, value];
      return;
    }

    query[key] = value;
  });

  return query;
};

export const toPositiveInteger = (
  value: string | string[] | number | null | undefined,
  fallback = 1,
): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};
