import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  PieChart, Pie, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, BarChart2, RefreshCw,
  ChevronUp, ChevronDown, Award, AlertTriangle,
  CheckCircle2, XCircle, Minus, Info, ArrowUpRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// ─── Types ─────────────────────────────────────────────────
interface Trade {
  date: string;
  signal: "call" | "put";
  confidence: string;
  confidenceScore: number;
  entryPrice: number;
  exitPrice: number;
  priceChangePct: number;
  optionOutcome: "win" | "loss" | "neutral";
  optionGainPct: number;
  signalReasons: string[];
}

interface BacktestResult {
  ticker: string;
  name: string;
  sector: string;
  totalSignals: number;
  callSignals: number;
  putSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  callWinRate: number;
  putWinRate: number;
  avgWinPct: number;
  avgLossPct: number;
  avgOptionGainOnWin: number;
  avgOptionLossOnLoss: number;
  expectancy: number;
  equityCurve: { date: string; cumulative: number; signal: string; win: boolean }[];
  trades: Trade[];
}

// ─── Helpers ───────────────────────────────────────────────
function WinRateBadge({ rate }: { rate: number }) {
  const color = rate >= 65 ? "text-bull" : rate >= 50 ? "text-neutral-amber" : "text-bear";
  const bg = rate >= 65 ? "badge-bull" : rate >= 50 ? "badge-neutral" : "badge-bear";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tabular ${bg}`}>
      {rate.toFixed(1)}%
    </span>
  );
}

function ExpectancyBadge({ value }: { value: number }) {
  const cls = value > 10 ? "text-bull" : value > 0 ? "text-neutral-amber" : "text-bear";
  return (
    <span className={`text-sm font-bold tabular ${cls}`}>
      {value > 0 ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function SignalBadge({ signal }: { signal: string }) {
  const isCall = signal === "call";
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold ${isCall ? "badge-bull" : "badge-bear"}`}>
      {isCall ? "▲ CALL" : "▼ PUT"}
    </span>
  );
}

// ─── Overall Summary Cards ──────────────────────────────────
function SummaryCards({ results }: { results: BacktestResult[] }) {
  const totalTrades = results.reduce((a, r) => a + r.totalSignals, 0);
  const totalWins = results.reduce((a, r) => a + r.wins, 0);
  const overallWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const avgExpectancy = results.length > 0
    ? results.reduce((a, r) => a + r.expectancy, 0) / results.length : 0;
  const bestTicker = results[0];
  const callWinRates = results.filter(r => r.callSignals > 0).map(r => r.callWinRate);
  const avgCallWR = callWinRates.length > 0 ? callWinRates.reduce((a, b) => a + b) / callWinRates.length : 0;

  return (
    <div className="grid grid-cols-4 gap-3 px-4 py-3">
      {[
        {
          label: "Overall Win Rate", value: `${overallWinRate.toFixed(1)}%`,
          sub: `${totalWins}W / ${totalTrades - totalWins}L of ${totalTrades} signals`,
          color: overallWinRate >= 55 ? "text-bull" : overallWinRate >= 45 ? "text-neutral-amber" : "text-bear",
          icon: <BarChart2 size={14} className="text-blue-accent" />,
        },
        {
          label: "Avg Call Win Rate", value: `${avgCallWR.toFixed(1)}%`,
          sub: "Across all tickers tested",
          color: avgCallWR >= 55 ? "text-bull" : "text-neutral-amber",
          icon: <TrendingUp size={14} className="text-bull" />,
        },
        {
          label: "Avg Expectancy", value: `${avgExpectancy > 0 ? "+" : ""}${avgExpectancy.toFixed(1)}%`,
          sub: "Est. option gain per signal",
          color: avgExpectancy > 0 ? "text-bull" : "text-bear",
          icon: <Award size={14} className="text-neutral-amber" />,
        },
        {
          label: "Best Performer", value: bestTicker?.ticker ?? "—",
          sub: bestTicker ? `${bestTicker.winRate.toFixed(1)}% win rate` : "No data",
          color: "text-purple-accent",
          icon: <ArrowUpRight size={14} className="text-purple-accent" />,
        },
      ].map(({ label, value, sub, color, icon }) => (
        <div key={label} className="kpi-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            {icon}
          </div>
          <div className={`text-xl font-bold tabular ${color}`}>{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Equity Curve Chart ─────────────────────────────────────
function EquityCurveChart({ result }: { result: BacktestResult }) {
  if (result.equityCurve.length < 2) {
    return <div className="text-xs text-muted-foreground text-center py-8">Not enough trades for equity curve</div>;
  }
  const data = [{ date: "Start", cumulative: 0 }, ...result.equityCurve];
  const final = data[data.length - 1].cumulative;
  const isPositive = final >= 0;

  return (
    <div style={{ height: 120 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`eq-${result.ticker}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "hsl(152,80%,50%)" : "hsl(0,72%,60%)"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isPositive ? "hsl(152,80%,50%)" : "hsl(0,72%,60%)"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <Tooltip
            content={({ active, payload }) => active && payload?.length ? (
              <div className="custom-tooltip">
                {payload[0].payload.date}: {Number(payload[0].value) >= 0 ? "+" : ""}{Number(payload[0].value).toFixed(1)}%
              </div>
            ) : null}
          />
          <Area type="monotone" dataKey="cumulative"
            stroke={isPositive ? "hsl(152,80%,50%)" : "hsl(0,72%,60%)"}
            strokeWidth={2} fill={`url(#eq-${result.ticker})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Trade Log ─────────────────────────────────────────────
function TradeLog({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) return <div className="text-xs text-muted-foreground py-4 text-center">No trades in this period</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-2 py-1.5 text-left">Date</th>
            <th className="px-2 py-1.5 text-left">Signal</th>
            <th className="px-2 py-1.5 text-right">Entry</th>
            <th className="px-2 py-1.5 text-right">Exit (10d)</th>
            <th className="px-2 py-1.5 text-right">Stock Δ</th>
            <th className="px-2 py-1.5 text-right">Est. Option</th>
            <th className="px-2 py-1.5 text-center">Result</th>
          </tr>
        </thead>
        <tbody>
          {trades.slice().reverse().map((t, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-accent/50 transition-colors">
              <td className="px-2 py-1.5 text-muted-foreground tabular">{t.date}</td>
              <td className="px-2 py-1.5"><SignalBadge signal={t.signal} /></td>
              <td className="px-2 py-1.5 text-right tabular text-foreground">${t.entryPrice.toFixed(2)}</td>
              <td className="px-2 py-1.5 text-right tabular text-foreground">${t.exitPrice.toFixed(2)}</td>
              <td className={`px-2 py-1.5 text-right tabular font-medium ${t.priceChangePct >= 0 ? "text-bull" : "text-bear"}`}>
                {t.priceChangePct >= 0 ? "+" : ""}{t.priceChangePct.toFixed(2)}%
              </td>
              <td className={`px-2 py-1.5 text-right tabular font-medium ${t.optionGainPct >= 0 ? "text-bull" : "text-bear"}`}>
                {t.optionGainPct >= 0 ? "+" : ""}{t.optionGainPct.toFixed(1)}%
              </td>
              <td className="px-2 py-1.5 text-center">
                {t.optionOutcome === "win"
                  ? <CheckCircle2 size={13} className="text-bull mx-auto" />
                  : <XCircle size={13} className="text-bear mx-auto" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Ticker Card ────────────────────────────────────────────
function TickerCard({ result, isSelected, onClick }: {
  result: BacktestResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  const rank = result.winRate >= 65 ? "🥇" : result.winRate >= 55 ? "🥈" : result.winRate >= 45 ? "🥉" : "";
  return (
    <div
      onClick={onClick}
      className={`kpi-card cursor-pointer transition-all ${isSelected ? "ring-1 ring-primary glow-green" : "hover:border-border/80"}`}
      data-testid={`bt-card-${result.ticker}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground text-sm">{result.ticker}</span>
            <span className="text-xs">{rank}</span>
          </div>
          <div className="text-xs text-muted-foreground truncate max-w-[120px]">{result.sector}</div>
        </div>
        <WinRateBadge rate={result.winRate} />
      </div>

      {/* Mini equity curve */}
      <EquityCurveChart result={result} />

      <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
        <div className="text-center">
          <div className="text-muted-foreground">Signals</div>
          <div className="font-bold text-foreground tabular">{result.totalSignals}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Expectancy</div>
          <ExpectancyBadge value={result.expectancy} />
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Call WR</div>
          <div className={`font-bold tabular ${result.callWinRate >= 55 ? "text-bull" : "text-muted-foreground"}`}>
            {result.callWinRate.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ───────────────────────────────────────────
function DetailPanel({ result }: { result: BacktestResult }) {
  const [tab, setTab] = useState<"overview" | "trades" | "breakdown">("overview");

  // Win/loss donut data
  const pieData = [
    { name: "Wins", value: result.wins, color: "hsl(152,80%,50%)" },
    { name: "Losses", value: result.losses, color: "hsl(0,72%,60%)" },
  ];

  return (
    <div className="detail-panel w-96 flex flex-col" data-testid="bt-detail">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-base">{result.ticker}</span>
              <WinRateBadge rate={result.winRate} />
            </div>
            <div className="text-xs text-muted-foreground">{result.name} · {result.sector}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Expectancy</div>
            <ExpectancyBadge value={result.expectancy} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {(["overview", "trades", "breakdown"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1 rounded text-xs transition-colors ${tab === t ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
        {tab === "overview" && (
          <>
            {/* Equity Curve */}
            <div className="chart-container p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                Cumulative Estimated Option P&L
              </div>
              <EquityCurveChart result={result} />
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">60-day backtest</span>
                <span className={result.equityCurve.length > 0
                  ? (result.equityCurve[result.equityCurve.length - 1].cumulative >= 0 ? "text-bull" : "text-bear")
                  : "text-muted-foreground"}>
                  {result.equityCurve.length > 0
                    ? `Final: ${result.equityCurve[result.equityCurve.length - 1].cumulative >= 0 ? "+" : ""}${result.equityCurve[result.equityCurve.length - 1].cumulative.toFixed(1)}%`
                    : "No data"}
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: "Total Signals", value: result.totalSignals },
                { label: "Win Rate", value: `${result.winRate.toFixed(1)}%` },
                { label: "Wins", value: result.wins, cls: "text-bull" },
                { label: "Losses", value: result.losses, cls: "text-bear" },
                { label: "Avg Win (stock)", value: `+${result.avgWinPct.toFixed(2)}%`, cls: "text-bull" },
                { label: "Avg Loss (stock)", value: `${result.avgLossPct.toFixed(2)}%`, cls: "text-bear" },
                { label: "Avg Option Gain", value: `+${result.avgOptionGainOnWin.toFixed(1)}%`, cls: "text-bull" },
                { label: "Avg Option Loss", value: `${result.avgOptionLossOnLoss.toFixed(1)}%`, cls: "text-bear" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-accent rounded px-2 py-1.5">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className={`font-bold tabular ${cls ?? "text-foreground"}`}>{value}</div>
                </div>
              ))}
            </div>

            {/* Expectancy explanation */}
            <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "hsl(210 90% 60% / 0.08)", border: "1px solid hsl(210 90% 60% / 0.2)", color: "hsl(210 90% 65%)" }}>
              <div className="font-semibold mb-1">What is Expectancy?</div>
              <div>Expectancy = (Win Rate × Avg Option Gain) + (Loss Rate × Avg Option Loss). A positive number means this signal has historically been profitable on average per trade.</div>
            </div>

            {/* Disclaimer */}
            <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "hsl(40 90% 52% / 0.08)", border: "1px solid hsl(40 90% 52% / 0.2)", color: "hsl(40 90% 62%)" }}>
              <div className="font-semibold mb-0.5">⚠ Important</div>
              <div>Option gain estimates use ~3x stock move leverage (ATM delta ~0.45). Real results depend on IV, theta decay, bid/ask spread, and exact strike/expiry. Past accuracy does not guarantee future results.</div>
            </div>
          </>
        )}

        {tab === "trades" && (
          <>
            <div className="text-xs text-muted-foreground mb-2">Last {result.trades.length} signals — 10-day outcomes</div>
            <TradeLog trades={result.trades} />
          </>
        )}

        {tab === "breakdown" && (
          <div className="space-y-4">
            {/* Call vs Put breakdown */}
            <div className="chart-container p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-3">Call vs Put Accuracy</div>
              <div className="space-y-3">
                {[
                  { label: "▲ CALL Signals", total: result.callSignals, wins: result.callWins, winRate: result.callWinRate, cls: "hsl(152,80%,50%)" },
                  { label: "▼ PUT Signals", total: result.putSignals, wins: result.putWins, winRate: result.putWinRate, cls: "hsl(0,72%,60%)" },
                ].map(({ label, total, wins, winRate, cls }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground">{label}</span>
                      <span className="tabular text-muted-foreground">{wins}W / {total - wins}L — <span style={{ color: cls }}>{winRate.toFixed(1)}%</span></span>
                    </div>
                    <div className="signal-bar-track">
                      <div className="signal-bar-fill" style={{ width: `${Math.min(100, winRate)}%`, background: cls }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Win/Loss donut */}
            <div className="chart-container p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Win / Loss Split</div>
              <div style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                      dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend formatter={(value) => <span style={{ color: "hsl(var(--foreground))", fontSize: "11px" }}>{value}</span>} />
                    <Tooltip formatter={(value) => [`${value} trades`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confidence breakdown */}
            <div className="chart-container p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Signal Breakdown</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Call signals</span>
                  <span className="tabular text-foreground">{result.callSignals} ({result.totalSignals > 0 ? ((result.callSignals / result.totalSignals) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Put signals</span>
                  <span className="tabular text-foreground">{result.putSignals} ({result.totalSignals > 0 ? ((result.putSignals / result.totalSignals) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg stock move (wins)</span>
                  <span className="tabular text-bull">+{result.avgWinPct.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg stock move (losses)</span>
                  <span className="tabular text-bear">{result.avgLossPct.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Backtest Page ─────────────────────────────────────
type SortKey = "winRate" | "expectancy" | "totalSignals" | "callWinRate";

export default function BacktestPage() {
  const [selected, setSelected] = useState<BacktestResult | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [filterMin, setFilterMin] = useState(2); // min signals filter
  const { toast } = useToast();

  const { data: response, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["/api/backtest"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/backtest");
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  const results: BacktestResult[] = response?.data ?? [];

  const sorted = useMemo(() => {
    return [...results]
      .filter(r => r.totalSignals >= filterMin)
      .sort((a, b) => b[sortKey] - a[sortKey]);
  }, [results, sortKey, filterMin]);

  async function handleRefresh() {
    await apiRequest("POST", "/api/backtest/refresh");
    refetch();
    toast({ title: "Backtest refreshed", description: "Re-running signal accuracy analysis" });
  }

  const overallWinRate = results.length > 0
    ? results.reduce((a, r) => a + r.winRate, 0) / results.length : 0;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      {/* Header */}
      <header className="dashboard-header px-4 flex items-center justify-between" style={{ minHeight: 56 }}>
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-foreground">Signal Backtester</h1>
          <span className="text-xs text-muted-foreground">
            {results.length} tickers · 60-day walk-forward test · 10-day outcome window
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Sort:</span>
            {([
              { key: "winRate", label: "Win Rate" },
              { key: "expectancy", label: "Expectancy" },
              { key: "callWinRate", label: "Call WR" },
              { key: "totalSignals", label: "Signals" },
            ] as { key: SortKey; label: string }[]).map(s => (
              <button key={s.key} onClick={() => setSortKey(s.key)}
                className={`px-2 py-1 rounded transition-colors ${sortKey === s.key ? "bg-primary/15 text-primary" : "hover:text-foreground"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
            onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      {results.length > 0 && <SummaryCards results={results} />}

      {/* Methodology note */}
      <div className="mx-4 mb-2 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs" style={{ background: "hsl(210 90% 60% / 0.08)", border: "1px solid hsl(210 90% 60% / 0.15)", color: "hsl(210 90% 65%)" }}>
        <Info size={12} className="flex-shrink-0" />
        <span>Walk-forward test: signals generated daily using only past data → outcome measured 10 calendar days later. Option gain estimated at ~3x stock move (ATM delta ~0.45). Not financial advice.</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Ticker grid */}
        <div className="flex-1 overflow-auto overscroll-contain p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-lg bg-muted animate-pulse" />
              ))}
              <div className="text-xs text-center text-muted-foreground py-4">
                Running backtests across all tickers…
              </div>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BarChart2 size={40} className="text-muted-foreground mb-3" />
              <div className="font-medium text-foreground mb-1">No backtest data yet</div>
              <div className="text-sm text-muted-foreground max-w-xs">
                The scanner needs to complete a full data fetch first. Go to the Scanner page and wait for it to load, then come back here.
              </div>
              <Button size="sm" className="mt-4" onClick={() => refetch()}>
                <RefreshCw size={12} className="mr-1.5" /> Run Backtest
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {sorted.map(r => (
                <TickerCard
                  key={r.ticker}
                  result={r}
                  isSelected={selected?.ticker === r.ticker}
                  onClick={() => setSelected(selected?.ticker === r.ticker ? null : r)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && <DetailPanel result={selected} />}
      </div>
    </div>
  );
}
