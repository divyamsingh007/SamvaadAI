const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

let refreshPromise: Promise<boolean> | null = null;

function getStoredToken(): string | null {
  return localStorage.getItem("accessToken");
}

function setStoredToken(token?: string): void {
  if (!token) return;
  localStorage.setItem("accessToken", token);
}

function buildHeaders(headers?: HeadersInit): Headers {
  const mergedHeaders = new Headers(headers);
  const token = getStoredToken();

  if (token) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  return mergedHeaders;
}

function buildUrl(input: string): string {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }

  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = input.startsWith("/") ? input : `/${input}`;
  return `${base}${path}`;
}

function shouldSkipRefresh(url: string): boolean {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh-token")
  );
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(buildUrl("/auth/refresh-token"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          return false;
        }

        const accessToken = result?.accessToken || result?.data?.accessToken || result?.token;
        setStoredToken(accessToken);
        return Boolean(accessToken);
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function apiFetch(input: string, init: RequestInit = {}, canRetry = true): Promise<Response> {
  const url = buildUrl(input);
  const response = await fetch(url, {
    ...init,
    headers: buildHeaders(init.headers),
    credentials: "include",
  });

  if (response.status !== 401 || !canRetry || shouldSkipRefresh(url)) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    localStorage.removeItem("accessToken");
    return response;
  }

  return apiFetch(input, init, false);
}

export function apiUrl(path: string): string {
  return buildUrl(path);
}
