import { useEffect } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingSuccess() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Refetch /api/me so the sidebar tier badge and gating both update.
    queryClient.invalidateQueries({ queryKey: ["/api/me"] });

    // Clear stripe redirect params from the URL so a refresh stays clean.
    const params = new URLSearchParams(window.location.search);
    if (params.has("stripe_session_id") || params.has("stripe_canceled")) {
      params.delete("stripe_session_id");
      params.delete("stripe_canceled");
      const qs = params.toString();
      const cleanUrl =
        window.location.pathname +
        (qs ? `?${qs}` : "") +
        window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }

    // Webhook may take a few seconds — re-poll /api/me at 2s, 5s, 10s.
    const timers = [2000, 5000, 10000].map((ms) =>
      setTimeout(
        () => queryClient.invalidateQueries({ queryKey: ["/api/me"] }),
        ms,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [queryClient]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
        <CheckCircle2 size={32} className="text-primary" />
      </div>

      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">
        Subscription confirmed
      </p>
      <h1 className="mb-3 text-3xl font-semibold text-foreground">
        Welcome to MomentumScan Pro.
      </h1>
      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        Your 7-day trial has started. Full scanner access, watchlist, and backtests
        are unlocked. You can manage or cancel your subscription anytime from the
        Account page.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/scanner">
          <Button size="lg">
            Go to scanner <ArrowRight size={16} />
          </Button>
        </Link>
        <Link href="/account">
          <Button variant="outline" size="lg">
            Manage subscription
          </Button>
        </Link>
      </div>

      <p className="mt-10 max-w-md text-[11px] leading-relaxed text-muted-foreground">
        Reminder: MomentumScan is an educational research tool, not investment
        advice. All scanner output is for informational and educational purposes
        only. Trading involves risk.
      </p>
    </div>
  );
}
