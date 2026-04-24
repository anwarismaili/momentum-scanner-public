import { useState } from "react";
import { useLocation } from "wouter";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { CLERK_ENABLED } from "@/hooks/useTier";
import { useToast } from "@/hooks/use-toast";

const FEATURES = [
  "Full scanner across 48 curated US growth tickers",
  "7 pattern types: breakout, accumulation, momentum, reversal, squeeze, and more",
  "Personal watchlist with priority tiers (A/B/C)",
  "Historical pattern backtester with hypothetical performance",
  "Daily workflow checklist and rules playbook",
  "Options pattern overlays with rationale and warnings",
  "News + catalyst feed attached to every ticker",
];

export default function Pricing() {
  const [location] = useLocation();
  const canceled = location.includes("canceled=1");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    if (!CLERK_ENABLED) {
      toast({
        title: "Sign-in not configured yet",
        description:
          "Set VITE_CLERK_PUBLISHABLE_KEY and connect Stripe to enable checkout.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/billing/checkout");
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="mb-8 text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">
          Pricing
        </p>
        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          One plan. Everything unlocked.
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          MomentumScan is an educational research tool. One tier, billed monthly,
          cancellable from your account at any time.
        </p>
      </div>

      {canceled && (
        <div className="mx-auto mb-6 flex max-w-xl items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div>
            <div className="font-medium text-foreground">Checkout canceled</div>
            <div className="text-xs text-muted-foreground">
              No charge was made. Try again whenever you&apos;re ready.
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md rounded-xl border border-primary/40 bg-card p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            MomentumScan Pro
          </span>
          <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-primary">
            7-day free trial
          </span>
        </div>
        <div className="mb-4 flex items-baseline gap-1">
          <span className="tabular font-mono text-5xl font-bold text-foreground">
            $39
          </span>
          <span className="text-sm text-muted-foreground">/ month</span>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Full scanner access. Cancel anytime from your account.
        </p>

        <Button
          onClick={startCheckout}
          disabled={loading}
          className="mb-4 w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Redirecting…
            </>
          ) : (
            "Start 7-day free trial"
          )}
        </Button>

        <ul className="space-y-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-foreground">
              <Check size={15} className="mt-0.5 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
          Your card is not charged during the 7-day trial. After the trial,
          $39/month recurring. You can cancel at any time and keep access until
          the end of your current billing period.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">
        By subscribing you agree to our{" "}
        <a href="/legal/terms.html" className="text-primary hover:underline">
          Terms
        </a>
        ,{" "}
        <a href="/legal/privacy.html" className="text-primary hover:underline">
          Privacy Policy
        </a>
        ,{" "}
        <a href="/legal/refund.html" className="text-primary hover:underline">
          Refund Policy
        </a>
        , and{" "}
        <a href="/legal/disclaimer.html" className="text-primary hover:underline">
          Risk Disclaimer
        </a>
        .
      </div>
    </div>
  );
}
