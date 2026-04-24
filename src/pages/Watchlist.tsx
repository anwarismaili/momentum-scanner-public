import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2, Star, ChevronUp, ChevronDown, Minus,
  Zap, TrendingUp, Volume2, AlertTriangle,
  BarChart2, Shield, Target, Clock, Plus
} from "lucide-react";
import type { WatchlistStock, ScannerStock } from "@/lib/types";
import { formatPrice, formatVolume } from "@/lib/mockData";

// ─── Shared helpers ─────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  high: "badge-bull",
  medium: "badge-watch",
  low: "badge-neutral",
};

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  high: <ChevronUp size={12} className="text-bull" />,
  medium: <Minus size={12} className="text-blue-accent" />,
  low: <ChevronDown size={12} className="text-muted-foreground" />,
};

// ─── Breakout Readiness Meter ───────────────────────────────
function BreakoutMeter({ stock }: { stock: ScannerStock }) {
  // Score from 0–100 based on distance to breakout, volume, RSI, momentum
  const distScore = Math.max(0, 100 - stock.distToBreakout * 20); // 0% away = 100, 5% away = 0
  const volScore = Math.min(100, stock.volumeRatio * 33);         // 3x = 100
  const rsiScore = stock.rsi >= 50 && stock.rsi <= 70 ? 100 : stock.rsi >= 45 ? 60 : 20;
  const emaScore = stock.emaAlignment ? 100 : 30;
  const readiness = Math.round((distScore * 0.35) + (volScore * 0.30) + (rsiScore * 0.20) + (emaScore * 0.15));

  const color =
    readiness >= 75 ? "hsl(152,80%,45%)" :
    readiness >= 50 ? "hsl(40,90%,52%)" :
    "hsl(var(--color-surface-4))";

  const label =
    readiness >= 75 ? "Ready" :
    readiness >= 50 ? "Building" : "Early";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Breakout Readiness</span>
          <span style={{ color }} className="font-medium">{label} — {readiness}%</span>
        </div>
        <div className="signal-bar-track">
          <div className="signal-bar-fill" style={{ width: `${readiness}%`, background: color, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Near Breakout Card ─────────────────────────────────────
function BreakoutCard({ stock, onAddWatchlist }: {
  stock: ScannerStock;
  onAddWatchlist: (s: ScannerStock) => void;
}) {
  const opt = stock.optionsSignal;
  const isCall = opt?.direction === "call";
  const isPut = opt?.direction === "put";
  const signalColor = isCall ? "text-bull" : isPut ? "text-bear" : "text-muted-foreground";
  const signalLabel = isCall ? "▲ CALL" : isPut ? "▼ PUT" : "— Wait";

  // Urgency: how close to breakout
  const urgency =
    stock.distToBreakout <= 1 ? "🔴 Imminent" :
    stock.distToBreakout <= 2 ? "🟡 Very Close" :
    "🟢 Setting Up";

  return (
    <div className="kpi-card border hover:border-primary/30 transition-all" data-testid={`breakout-${stock.ticker}`}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">{stock.ticker}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              stock.watchlistPriority === "A" ? "badge-bull" :
              stock.watchlistPriority === "B" ? "badge-watch" : "badge-neutral"
            }`}>{stock.watchlistPriority}</span>
            <span className="text-xs text-muted-foreground">{urgency}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{stock.name}</div>
          <div className="text-xs text-muted-foreground opacity-70">{stock.sector}</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold tabular text-foreground">{formatPrice(stock.price)}</div>
          <div className={`text-xs tabular font-medium ${stock.change >= 0 ? "text-bull" : "text-bear"}`}>
            {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Breakout meter */}
      <BreakoutMeter stock={stock} />

      {/* Key stats row */}
      <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
        <div className="text-center">
          <div className="text-muted-foreground mb-0.5">To BO</div>
          <div className={`font-bold tabular ${stock.distToBreakout <= 1.5 ? "text-bull" : "text-neutral-amber"}`}>
            {stock.distToBreakout.toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground mb-0.5">Vol Ratio</div>
          <div className={`font-bold tabular ${stock.volumeRatio >= 2 ? "text-bull" : "text-foreground"}`}>
            {stock.volumeRatio.toFixed(1)}x
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground mb-0.5">RSI</div>
          <div className={`font-bold tabular ${stock.rsi >= 55 && stock.rsi <= 70 ? "text-bull" : "text-foreground"}`}>
            {stock.rsi.toFixed(0)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground mb-0.5">Score</div>
          <div className={`font-bold tabular ${stock.score >= 70 ? "text-bull" : stock.score >= 50 ? "text-neutral-amber" : "text-muted-foreground"}`}>
            {stock.score}
          </div>
        </div>
      </div>

      {/* Confirmation signals */}
      <div className="flex flex-wrap gap-1 mt-2">
        {stock.emaAlignment && (
          <span className="px-1.5 py-0.5 rounded text-xs badge-bull">EMA ✓</span>
        )}
        {stock.volumeRatio >= 1.5 && (
          <span className="px-1.5 py-0.5 rounded text-xs badge-bull">Vol {stock.volumeRatio.toFixed(1)}x</span>
        )}
        {stock.isAccumulating && (
          <span className="px-1.5 py-0.5 rounded text-xs badge-watch">Accum.</span>
        )}
        {stock.volatilitySqueezing && (
          <span className="px-1.5 py-0.5 rounded text-xs badge-neutral">Squeeze</span>
        )}
        {stock.newsPositive && (
          <span className="px-1.5 py-0.5 rounded text-xs badge-watch">+News</span>
        )}
        {stock.macdSignal === "bull" && (
          <span className="px-1.5 py-0.5 rounded text-xs badge-bull">MACD ✓</span>
        )}
      </div>

      {/* Entry zone + Options signal */}
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
        <div className="text-xs">
          <span className="text-muted-foreground">Entry: </span>
          <span className="tabular text-foreground font-medium">
            {formatPrice(stock.entryLow)} – {formatPrice(stock.entryHigh)}
          </span>
          <span className="text-muted-foreground ml-2">Stop: </span>
          <span className="tabular text-bear font-medium">{formatPrice(stock.stopLoss)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {opt && opt.direction !== "no_trade" && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isCall ? "badge-bull" : "badge-bear"}`}>
              {signalLabel}
            </span>
          )}
          <button
            onClick={() => onAddWatchlist(stock)}
            className="p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors"
            data-testid={`add-bo-${stock.ticker}`}
            title="Add to watchlist"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Near Breakout Tab ──────────────────────────────────────
function NearBreakoutTab() {
  const [threshold, setThreshold] = useState(3);   // % to 20-day high
  const [minVolRatio, setMinVolRatio] = useState(1.0);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: scanResponse, isLoading } = useQuery({
    queryKey: ["/api/scan"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/scan");
      return res.json();
    },
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });

  const allStocks: ScannerStock[] = scanResponse?.data ?? [];

  const nearBreakout = useMemo(() => {
    return allStocks
      .filter(s => s.distToBreakout <= threshold && s.volumeRatio >= minVolRatio)
      .sort((a, b) => {
        // Primary: volume ratio (highest first)
        // Secondary: distance to breakout (smallest first)
        const volDiff = b.volumeRatio - a.volumeRatio;
        if (Math.abs(volDiff) > 0.1) return volDiff;
        return a.distToBreakout - b.distToBreakout;
      });
  }, [allStocks, threshold, minVolRatio]);

  async function handleAddWatchlist(stock: ScannerStock) {
    try {
      await apiRequest("POST", "/api/watchlist", {
        ticker: stock.ticker,
        name: stock.name,
        priority: stock.distToBreakout <= 1.5 ? "high" : stock.distToBreakout <= 2.5 ? "medium" : "low",
        note: `Near Breakout: ${stock.distToBreakout.toFixed(1)}% to high | Vol ${stock.volumeRatio.toFixed(1)}x | Score ${stock.score}`,
        addedAt: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: `${stock.ticker} added`, description: `${stock.distToBreakout.toFixed(1)}% from breakout` });
    } catch {
      toast({ title: "Error adding to watchlist", variant: "destructive" });
    }
  }

  // Grouped by urgency
  const imminent = nearBreakout.filter(s => s.distToBreakout <= 1);
  const veryClose = nearBreakout.filter(s => s.distToBreakout > 1 && s.distToBreakout <= 2);
  const settingUp = nearBreakout.filter(s => s.distToBreakout > 2);

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filter controls */}
      <div className="px-4 py-3 border-b border-border space-y-3">
        {/* Threshold slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <Target size={12} className="text-primary" />
              <span className="font-medium text-foreground">Distance to 20-day High</span>
            </div>
            <span className="tabular font-bold text-primary">≤ {threshold.toFixed(1)}%</span>
          </div>
          <input
            type="range" min="0.5" max="5" step="0.5"
            value={threshold}
            onChange={e => setThreshold(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "hsl(152,80%,45%)" }}
            data-testid="threshold-slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
            <span>0.5% (tightest)</span>
            <span>5% (wider)</span>
          </div>
        </div>

        {/* Min volume ratio */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5">
              <Volume2 size={12} className="text-neutral-amber" />
              <span className="font-medium text-foreground">Min Volume Ratio</span>
            </div>
            <span className="tabular font-bold text-neutral-amber">≥ {minVolRatio.toFixed(1)}x avg</span>
          </div>
          <input
            type="range" min="1" max="3" step="0.5"
            value={minVolRatio}
            onChange={e => setMinVolRatio(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "hsl(40,90%,52%)" }}
            data-testid="vol-ratio-slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
            <span>1.0x (any vol)</span>
            <span>3.0x (spike only)</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">{nearBreakout.length} stocks match</span>
          {imminent.length > 0 && <span className="text-bear font-medium">🔴 {imminent.length} imminent</span>}
          {veryClose.length > 0 && <span className="text-neutral-amber font-medium">🟡 {veryClose.length} very close</span>}
          {settingUp.length > 0 && <span className="text-bull font-medium">🟢 {settingUp.length} setting up</span>}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-4">
        {nearBreakout.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Target size={36} className="text-muted-foreground mb-3" />
            <div className="font-medium text-foreground mb-1">No stocks within {threshold}%</div>
            <div className="text-sm text-muted-foreground">
              Try increasing the distance threshold or lowering the volume filter.
            </div>
          </div>
        ) : (
          <>
            {/* Imminent group */}
            {imminent.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">Imminent — within 1%</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {imminent.map(s => (
                    <BreakoutCard key={s.ticker} stock={s} onAddWatchlist={handleAddWatchlist} />
                  ))}
                </div>
              </div>
            )}

            {/* Very close group */}
            {veryClose.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-xs font-semibold text-foreground">Very Close — 1–2%</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {veryClose.map(s => (
                    <BreakoutCard key={s.ticker} stock={s} onAddWatchlist={handleAddWatchlist} />
                  ))}
                </div>
              </div>
            )}

            {/* Setting up group */}
            {settingUp.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-foreground">Setting Up — 2–{threshold}%</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {settingUp.map(s => (
                    <BreakoutCard key={s.ticker} stock={s} onAddWatchlist={handleAddWatchlist} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── My Watchlist Tab ───────────────────────────────────────
function MyWatchlistTab() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: watchlist = [], isLoading } = useQuery<WatchlistStock[]>({
    queryKey: ["/api/watchlist"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/watchlist");
      return res.json();
    },
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/watchlist/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Removed from watchlist" });
    },
  });

  const priorityMut = useMutation({
    mutationFn: ({ id, priority }: { id: number; priority: string }) =>
      apiRequest("PATCH", `/api/watchlist/${id}/priority`, { priority }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/watchlist"] }),
  });

  const grouped = {
    high: watchlist.filter(s => s.priority === "high"),
    medium: watchlist.filter(s => s.priority === "medium"),
    low: watchlist.filter(s => s.priority === "low"),
  };
  const byPriority = [...grouped.high, ...grouped.medium, ...grouped.low];

  function cyclePriority(stock: WatchlistStock) {
    const order = ["high", "medium", "low"];
    const next = order[(order.indexOf(stock.priority) + 1) % order.length];
    priorityMut.mutate({ id: stock.id, priority: next });
  }

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <Star size={40} className="text-muted-foreground mb-3" />
        <div className="text-foreground font-medium mb-1">Watchlist is empty</div>
        <div className="text-sm text-muted-foreground max-w-xs">
          Go to the <strong>Near Breakout</strong> tab or the Scanner and click <strong>+</strong> to add stocks here.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-2">
      {byPriority.map(stock => (
        <div key={stock.id}
          className="kpi-card flex items-center justify-between gap-3 animate-in"
          data-testid={`watchlist-${stock.ticker}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => cyclePriority(stock)} title="Click to change priority"
              className="w-8 h-8 flex items-center justify-center">
              {PRIORITY_ICON[stock.priority]}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{stock.ticker}</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${PRIORITY_COLORS[stock.priority]}`}>
                  {stock.priority}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{stock.name}</div>
              {stock.note && (
                <div className="text-xs text-muted-foreground opacity-70 mt-0.5">{stock.note}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground text-right">
              {new Date(stock.addedAt).toLocaleDateString()}
            </div>
            <button onClick={() => removeMut.mutate(stock.id)}
              className="p-1.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
              data-testid={`remove-${stock.id}`} title="Remove">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Watchlist Page ─────────────────────────────────────
export default function WatchlistPage() {
  const [tab, setTab] = useState<"breakout" | "watchlist">("breakout");

  const { data: scanResponse } = useQuery({
    queryKey: ["/api/scan"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/scan");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: watchlistData = [] } = useQuery<WatchlistStock[]>({
    queryKey: ["/api/watchlist"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/watchlist");
      return res.json();
    },
  });

  const allStocks: ScannerStock[] = scanResponse?.data ?? [];
  const nearCount = allStocks.filter(s => s.distToBreakout <= 3).length;
  const watchCount = watchlistData.length;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      {/* Header */}
      <header className="dashboard-header px-4 flex items-center justify-between" style={{ minHeight: 56 }}>
        <h1 className="text-sm font-bold text-foreground">Watchlist</h1>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap size={11} className="text-primary" />
          <span>Auto-updates with live scan</span>
        </div>
      </header>

      {/* Tab bar */}
      <div className="px-4 pt-3 pb-0 flex gap-0 border-b border-border">
        <button
          onClick={() => setTab("breakout")}
          data-testid="tab-breakout"
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "breakout"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}>
          <Target size={14} />
          Near Breakout
          {nearCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold badge-bull">
              {nearCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("watchlist")}
          data-testid="tab-watchlist"
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "watchlist"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}>
          <Star size={14} />
          My Watchlist
          {watchCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              {watchCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === "breakout" ? <NearBreakoutTab /> : <MyWatchlistTab />}
      </div>
    </div>
  );
}
