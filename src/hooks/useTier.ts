/**
 * useTier — tier gating for Pro features.
 *
 * Three states:
 *   "guest" — Clerk isn't configured yet (no VITE_CLERK_PUBLISHABLE_KEY).
 *             The app renders without authentication and shows upgrade banners.
 *   "free"  — signed in, no Pro subscription.
 *   "pro"   — signed in, active subscription.
 *
 * When Clerk keys are present we fetch /api/me once per session. Until then
 * we short-circuit to "guest" and skip the network round-trip.
 */
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type Tier = "guest" | "free" | "pro";

export interface MeResponse {
  tier: "free" | "pro";
  status?: string;
  email?: string;
  cancel_at_period_end?: boolean;
  current_period_end?: string | null;
}

export const CLERK_ENABLED = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function useMe() {
  return useQuery<MeResponse | null>({
    queryKey: ["/api/me"],
    enabled: CLERK_ENABLED,
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/me");
        return (await res.json()) as MeResponse;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
  });
}

export function useTier(): Tier {
  const { data } = useMe();
  if (!CLERK_ENABLED) return "guest";
  return data?.tier ?? "free";
}

export function isProOrPreview(tier: Tier): boolean {
  // In guest mode we preview the full UI (populated with mock data) so users
  // can evaluate what Pro unlocks before authenticating.
  return tier === "pro" || tier === "guest";
}
