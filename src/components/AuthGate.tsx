import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Lock, Shield } from "lucide-react";
import { CLERK_ENABLED } from "@/hooks/useTier";

/**
 * AuthGate — require a signed-in Clerk user before rendering children.
 * If Clerk isn't configured (no VITE_CLERK_PUBLISHABLE_KEY), passes through
 * so local dev still works.
 *
 * Presents a dark-terminal sign-in wall consistent with the scanner aesthetic.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  if (!CLERK_ENABLED) return <>{children}</>;

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <Lock size={20} className="text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
              Sign in to continue
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              MomentumScan is an educational research tool for active traders. Create
              a free account to access the scanner, watchlist, and backtester.
            </p>

            <div className="flex flex-col gap-2">
              <SignUpButton mode="modal">
                <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Create free account
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="w-full rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                  Sign in
                </button>
              </SignInButton>
            </div>

            <div className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-left">
              <Shield size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-[11px] leading-snug text-muted-foreground">
                Free account gets you the Playbook and Workflow. Scanner, Watchlist, and
                Backtester unlock on the Pro plan &mdash; $39/mo with a 7-day free trial.
                Educational research only. Not financial advice.
              </p>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
