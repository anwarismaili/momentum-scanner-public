import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import App from "./App";
import { queryClient } from "./lib/queryClient";
import { setAuthToken } from "./lib/queryClient";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

/**
 * AuthBridge keeps the module-level `_authToken` inside queryClient.ts
 * in sync with Clerk's session. Every render we pull a fresh token and
 * push it into the shared slot; `apiRequest` and `getQueryFn` read from
 * there so every API call carries the right Authorization header.
 */
function AuthBridge({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      if (!isSignedIn) {
        setAuthToken(null);
        return;
      }
      try {
        const token = await getToken();
        if (!cancelled) setAuthToken(token);
      } catch {
        if (!cancelled) setAuthToken(null);
      }
    }
    refresh();
    // Refresh token every 50s (Clerk tokens last ~60s).
    const id = setInterval(refresh, 50_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isSignedIn, getToken]);

  return <>{children}</>;
}

function Root() {
  // When no Clerk key is configured (local dev fallback), render the
  // app in guest mode without the provider so you can still iterate.
  if (!PUBLISHABLE_KEY) {
    return (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/#/"
      signInUrl="/#/sign-in"
      signUpUrl="/#/sign-up"
    >
      <QueryClientProvider client={queryClient}>
        <AuthBridge>
          <App />
        </AuthBridge>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
