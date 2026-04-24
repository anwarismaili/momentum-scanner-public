/**
 * API client for MomentumScan backend.
 *
 * The backend is at https://ms-public-api-production.up.railway.app.
 * Every request carries a Clerk JWT in Authorization: Bearer <token>.
 * 402 responses mean a free user hit a Pro endpoint → bounce to /pricing.
 *
 * Two entry points:
 *   - `useApi()` hook — hook-based, pulls getToken from Clerk (preferred).
 *   - `apiRequest()` module-level fallback — uses a token set via setAuthToken().
 *
 * Legacy pages still import `apiRequest` by path alias; keep the signature.
 */
import { QueryClient, type QueryFunction } from "@tanstack/react-query";

export const API_BASE = "https://ms-public-api-production.up.railway.app";

// ─── Module-level token (set by App on sign-in) ─────────────────────
let _authToken: string | null = null;
export function setAuthToken(token: string | null) {
  _authToken = token;
}

async function throwIfResNotOk(res: Response) {
  if (res.status === 402) {
    if (typeof window !== "undefined") window.location.href = "/pricing";
    throw new Error("payment_required");
  }
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// ─── Legacy module-level request (used by copied pages) ────────────
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  if (_authToken) headers["Authorization"] = `Bearer ${_authToken}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const headers: Record<string, string> = {};
    if (_authToken) headers["Authorization"] = `Bearer ${_authToken}`;
    const res = await fetch(`${API_BASE}${url.startsWith("/") ? url : "/" + url}`, {
      headers,
    });
    if (on401 === "returnNull" && res.status === 401) return null as any;
    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: false,
    },
    mutations: { retry: false },
  },
});
