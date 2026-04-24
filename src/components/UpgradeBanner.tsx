import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import { useTier } from "@/hooks/useTier";

export function UpgradeBanner({ feature = "the full scanner" }: { feature?: string }) {
  const tier = useTier();
  if (tier === "pro") return null;

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
        <div className="text-foreground">
          You&apos;re previewing {feature} with sample data.{" "}
          <span className="text-muted-foreground">
            Unlock live scans, alerts, and backtests with Pro — $39/mo, 7-day free trial.
          </span>
        </div>
      </div>
      <Link
        href="/pricing"
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
