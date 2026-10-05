export const TOKEN_COOKIE = "erp_token";
const TOKEN_STORAGE_KEY = "erp_access_token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  document.cookie = `${TOKEN_COOKIE}=1; path=/; max-age=${TOKEN_MAX_AGE}; SameSite=Lax`;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
