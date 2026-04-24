import { useEffect, useRef } from "react";
import { useClerk, useAuth } from "@clerk/clerk-react";
import { CLERK_ENABLED } from "@/hooks/useTier";

/**
 * AuthIntentOpener — reads ?action=signup or ?action=signin from the URL
 * on first load and pops the matching Clerk modal. Lets external pages
 * (marketing landing, emails) deep-link into the sign-up / sign-in flow
 * without needing to host their own auth UI.
 *
 * The query string lives on the non-hash URL, e.g.
 *   https://app.example.com/?action=signup#/scanner
 * so we read window.location.search directly (wouter's hash router
 * ignores the query portion of the browser URL).
 */
export function AuthIntentOpener() {
  const { openSignIn, openSignUp } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const fired = useRef(false);

  useEffect(() => {
    if (!CLERK_ENABLED || !isLoaded || fired.current) return;
    if (isSignedIn) return; // don't nag already-signed-in users

    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action !== "signup" && action !== "signin") return;

    fired.current = true;

    // Strip ?action from the URL so a refresh doesn't re-trigger.
    params.delete("action");
    const qs = params.toString();
    const cleanUrl =
      window.location.pathname +
      (qs ? `?${qs}` : "") +
      window.location.hash;
    window.history.replaceState({}, "", cleanUrl);

    if (action === "signup") openSignUp({});
    else openSignIn({});
  }, [isLoaded, isSignedIn, openSignIn, openSignUp]);

  return null;
}
