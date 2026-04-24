import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { Link } from "wouter";
import { useTier, CLERK_ENABLED } from "@/hooks/useTier";

/**
 * TopBar — auth controls + current tier pill.
 *
 * Only rendered when Clerk is configured. In guest mode it stays out of
 * the way so the scanner can be demoed without an account.
 */
export function TopBar() {
  const tier = useTier();

  if (!CLERK_ENABLED) return null;

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          MomentumScan
        </span>
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
            tier === "pro"
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          {tier}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">
              Create account
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          {tier === "free" && (
            <Link
              href="/pricing"
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              Upgrade
            </Link>
          )}
          <UserButton afterSignOutUrl="https://anwarismaili.github.io/momentumscan-landing/" />
        </SignedIn>
      </div>
    </header>
  );
}
