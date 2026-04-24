import { Switch, Route, Redirect, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthGate } from "./components/AuthGate";
import { AuthIntentOpener } from "./components/AuthIntentOpener";
import ScannerPage from "./pages/Scanner";
import WatchlistPage from "./pages/Watchlist";
import BacktestPage from "./pages/Backtest";
import PlaybookPage from "./pages/Playbook";
import WorkflowPage from "./pages/Workflow";
import Pricing from "./pages/Pricing";
import BillingSuccess from "./pages/BillingSuccess";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

/**
 * Route map
 *   Public: /playbook, /workflow, /pricing, /billing/success
 *   Gated:  /scanner, /watchlist, /backtest, /account
 *
 * Public routes let visitors preview the rules and plan info before committing
 * to signup. Gated routes show a modal-friendly sign-in wall when signed out.
 */
export default function App() {
  return (
    <Router hook={useHashLocation}>
      <AuthIntentOpener />
      <AppLayout>
        <Switch>
          <Route path="/"><Redirect to="/scanner" /></Route>

          {/* Gated — require Clerk sign-in */}
          <Route path="/scanner">
            <AuthGate><ScannerPage /></AuthGate>
          </Route>
          <Route path="/watchlist">
            <AuthGate><WatchlistPage /></AuthGate>
          </Route>
          <Route path="/backtest">
            <AuthGate><BacktestPage /></AuthGate>
          </Route>
          <Route path="/account">
            <AuthGate><Account /></AuthGate>
          </Route>

          {/* Public */}
          <Route path="/playbook" component={PlaybookPage} />
          <Route path="/workflow" component={WorkflowPage} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/billing/success" component={BillingSuccess} />

          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </Router>
  );
}
