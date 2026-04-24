import { useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useMe, useTier, CLERK_ENABLED } from "@/hooks/useTier";
import { useToast } from "@/hooks/use-toast";

export default function Account() {
  const tier = useTier();
  const { data: me, isLoading } = useMe();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/billing/portal");
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      toast({
        title: "Could not open customer portal",
        description: (err as Error).message,
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 border-b border-border pb-4">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-primary">
          Account
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          Subscription &amp; billing
        </h1>
      </div>

      {!CLERK_ENABLED && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-border bg-card p-4 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div>
            <div className="font-medium text-foreground">
              Authentication not configured
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              This build runs in guest preview. Sign-in, /api/me, and the Stripe
              portal will come online once{" "}
              <code className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> is set
              and the billing API is live.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Current plan
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="tabular font-mono text-2xl font-bold text-foreground">
                {tier === "pro" ? "Pro" : tier === "free" ? "Free" : "Guest"}
              </span>
              {me?.status && (
                <span className="rounded border border-border px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                  {me.status}
                </span>
              )}
            </div>
          </div>
          {tier === "pro" && (
            <Button onClick={openPortal} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Opening…
                </>
              ) : (
                <>
                  Manage subscription <ExternalLink size={14} />
                </>
              )}
            </Button>
          )}
        </div>

        {me?.cancel_at_period_end && me?.current_period_end && (
          <div className="mb-4 rounded-md border border-border bg-background/50 p-3 text-xs text-muted-foreground">
            Subscription cancels at end of current period (
            {new Date(me.current_period_end).toLocaleDateString()}).
          </div>
        )}

        {tier !== "pro" && (
          <div className="mt-2">
            <p className="mb-3 text-sm text-muted-foreground">
              Upgrade to MomentumScan Pro to unlock live scans, watchlist alerts,
              and backtests. $39/month with a 7-day free trial.
            </p>
            <Link href="/pricing">
              <Button>Upgrade to Pro</Button>
            </Link>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" /> Loading subscription…
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2 text-xs text-muted-foreground">
        <p>
          Questions about billing? See our{" "}
          <a href="/legal/refund.html" className="text-primary hover:underline">
            refund policy
          </a>
          .
        </p>
        <p>
          Read the{" "}
          <a href="/legal/terms.html" className="text-primary hover:underline">
            Terms
          </a>
          {" · "}
          <a href="/legal/privacy.html" className="text-primary hover:underline">
            Privacy
          </a>
          {" · "}
          <a href="/legal/disclaimer.html" className="text-primary hover:underline">
            Risk Disclaimer
          </a>
          .
        </p>
      </div>
    </div>
  );
}
