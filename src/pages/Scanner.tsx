import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle, Shield,
  Zap, Eye, Star, ChevronUp, ChevronDown, Minus,
  Volume2, BarChart2, Filter, RefreshCw, X, Plus, Info,
  Clock, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatVolume, formatPrice } from "@/lib/mockData";
import type { ScannerStock, SetupType, RiskLevel, OptionsSignal } from "@/lib/types";
import { CATALYST_LABELS, CATALYST_COLORS } from "@/lib/types";

// ─── Setup labels / colors ─────────────────────────────────
const SETUP_LABELS: Record<string, string> = {
  breakout: "Breakout",
  accumulation: "Accumulation",
  momentum: "Momentum",
  reversal: "Reversal",
  squeeze: "Vol Squeeze",
};

const SETUP_COLORS: Record<string, string> = {
  breakout: "badge-bull",
  accumulation: "badge-watch",
  momentum: "badge-bull",
  reversal: "badge-neutral",
  squeeze: "badge-neutral",
};

// ─── Score Ring ────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "hsl(152,80%,50%)" : score >= 60 ? "hsl(40,90%,58%)" : "hsl(0,72%,60%)";
  return (
    <div className="relative inline-flex items-center justify-center w-11 h-11">
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--color-surface-4))" strokeWidth="3" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <span className="absolute text-xs font-bold tabular" style={{ color }}>{score}</span>
    </div>
  );
}

// ─── Sparkline ─────────────────────────────────────────────
function Sparkline({ data, color = "hsl(152,80%,50%)" }: { data: number[]; color?: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  const id = `sg${color.replace(/[^a-z0-9]/gi, "").slice(0, 8)}`;
  return (
    <ResponsiveContainer width={72} height={28}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Signal Bar ────────────────────────────────────────────
function SignalBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 75 ? "hsl(152,80%,45%)" : pct >= 50 ? "hsl(40,90%,52%)" : "hsl(0,72%,55%)";
  return (
    <div className="signal-bar-track w-16">
      <div className="signal-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const map = { low: "badge-bull", medium: "badge-neutral", high: "badge-bear" };
  const icons = { low: <Shield size={10} />, medium: <AlertTriangle size={10} />, high: <AlertTriangle size={10} /> };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${map[level]}`}>
      {icons[level]} {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function PriorityBadge({ p }: { p: "A" | "B" | "C" }) {
  const map = { A: "badge-bull", B: "badge-watch", C: "badge-neutral" };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${map[p]}`}>{p}</span>
  );
}

function SentimentBadge({ score, label }: { score: number; label: string }) {
  const config = {
    bullish: { cls: "badge-bull", icon: "↑", text: "Bull" },
    bearish: { cls: "badge-bear", icon: "↓", text: "Bear" },
    neutral: { cls: "badge-neutral", icon: "—", text: "Neut" },
  };
  const c = config[label as keyof typeof config] ?? config.neutral;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${c.cls}`}>
      {c.icon} {c.text}
    </span>
  );
}

function OptionsSignalBadge({ signal }: { signal: any }) {
  if (!signal) return null;
  const { direction, confidence, confidenceScore } = signal;
  if (direction === "no_trade") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium badge-neutral">
        — Wait
      </span>
    );
  }
  const isCall = direction === "call";
  const cls = isCall ? "badge-bull" : "badge-bear";
  const icon = isCall ? "▲" : "▼";
  const label = isCall ? "CALL" : "PUT";
  const confDot = confidence === "high" ? "●●●" : confidence === "medium" ? "●●○" : "●○○";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold ${cls}`}
      title={`${label} — ${confidence} confidence (${confidenceScore})`}>
      {icon} {label}
      <span style={{ fontSize: "0.55rem", letterSpacing: "-1px", opacity: 0.8 }}>{confDot}</span>
    </span>
  );
}

// ─── Status Banner ─────────────────────────────────────────
function StatusBanner({ status, message, fetchedAt, inProgress }: {
  status: string; message?: string; fetchedAt?: number; inProgress?: boolean;
}) {
  if (status === "ok" || !status) return null;
  const ageMin = fetchedAt ? Math.round((Date.now() - fetchedAt) / 60000) : null;

  if (status === "loading" || inProgress) {
    return (
      <div className="mx-4 mb-2 px-3 py-2 rounded-lg flex items-center gap-2 text-xs"
        style={{ background: "hsl(210 90% 60% / 0.1)", border: "1px solid hsl(210 90% 60% / 0.25)", color: "hsl(210 90% 65%)" }}>
        <Loader2 size={12} className="animate-spin" />
        <span>Fetching live data from Polygon.io — this takes ~30 seconds on the free plan…</span>
      </div>
    );
  }
  if (status === "refreshing") {
    return (
      <div className="mx-4 mb-2 px-3 py-2 rounded-lg flex items-center gap-2 text-xs"
        style={{ background: "hsl(40 90% 52% / 0.1)", border: "1px solid hsl(40 90% 52% / 0.25)", color: "hsl(40 90% 62%)" }}>
        <RefreshCw size={12} className="animate-spin" />
        <span>Refreshing data in background{ageMin !== null ? ` · last updated ${ageMin}m ago` : ""}…</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mx-4 mb-2 px-3 py-2 rounded-lg flex items-center gap-2 text-xs"
        style={{ background: "hsl(0 72% 51% / 0.1)", border: "1px solid hsl(0 72% 51% / 0.25)", color: "hsl(0 72% 65%)" }}>
        <AlertCircle size={12} />
        <span>Data error: {message ?? "Unknown error"}. Showing last cached data.</span>
      </div>
    );
  }
  if (status === "partial") {
    return (
      <div className="mx-4 mb-2 px-3 py-2 rounded-lg flex items-center gap-2 text-xs"
        style={{ background: "hsl(40 90% 52% / 0.1)", border: "1px solid hsl(40 90% 52% / 0.25)", color: "hsl(40 90% 62%)" }}>
        <AlertTriangle size={12} />
        <span>{message ?? "Partial data — market may be closed or outside trading hours."}</span>
      </div>
    );
  }
  return null;
}

// ─── Detail Panel ──────────────────────────────────────────
function DetailPanel({ stock, onClose, onAddWatchlist }: {
  stock: ScannerStock;
  onClose: () => void;
  onAddWatchlist: (s: ScannerStock) => void;
}) {
  const [tab, setTab] = useState<"price" | "volume">("price");
  const priceData = stock.priceHistory.map((v, i) => ({ i: i + 1, v }));
  const volData = stock.volumeHistory.map((v, i) => ({ i: i + 1, v: Math.round(v / 1000) }));
  const avgVolK = Math.round(stock.avgVolume / 1000);
  const lastUpdated = stock.lastUpdated
    ? new Date(stock.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="detail-panel w-80 flex flex-col" data-testid="detail-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">{stock.ticker}</span>
            <PriorityBadge p={stock.watchlistPriority} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{stock.name}</div>
          <div className="text-xs text-muted-foreground">{stock.sector}</div>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock size={10} /> Updated {lastUpdated}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
            onClick={() => onAddWatchlist(stock)} data-testid="btn-add-watchlist">
            <Star size={12} className="mr-1" /> Watch
          </Button>
          <button onClick={onClose}
            className="p-1 rounded hover:bg-accent text-muted-foreground" data-testid="btn-close-detail">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Price & Score */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold tabular text-foreground">{formatPrice(stock.price)}</div>
              <div className={`text-sm font-medium tabular flex items-center gap-1 ${stock.change >= 0 ? "text-bull" : "text-bear"}`}>
                {stock.change >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
              </div>
            </div>
            <div className="text-center">
              <ScoreRing score={stock.score} />
              <div className="text-xs text-muted-foreground mt-0.5">Score</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex gap-2 mb-2">
            {(["price", "volume"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`text-xs px-2 py-1 rounded transition-colors ${tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ height: 100 }}>
            {tab === "price" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="dp-grad-live" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152,80%,50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(152,80%,50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="i" hide />
                  <YAxis domain={["auto", "auto"]} hide />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="custom-tooltip">${Number(payload[0].value ?? 0).toFixed(2)}</div>
                  ) : null} />
                  <Area type="monotone" dataKey="v" stroke="hsl(152,80%,50%)" strokeWidth={2}
                    fill="url(#dp-grad-live)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <XAxis dataKey="i" hide />
                  <YAxis hide />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="custom-tooltip">{payload[0].value}K</div>
                  ) : null} />
                  <ReferenceLine y={avgVolK} stroke="hsl(40,90%,55%)" strokeDasharray="3 3" />
                  <Bar dataKey="v" radius={[2, 2, 0, 0]} fill="hsl(210,90%,60%)" style={{ opacity: 0.8 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Entry Zone */}
        <div className="px-4 py-3 border-b border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Entry Zone</div>
          <div className="flex gap-2 text-sm">
            <div className="flex-1 bg-accent rounded px-2 py-1.5">
              <div className="text-xs text-muted-foreground">Low</div>
              <div className="font-bold tabular text-foreground">{formatPrice(stock.entryLow)}</div>
            </div>
            <div className="flex-1 bg-accent rounded px-2 py-1.5">
              <div className="text-xs text-muted-foreground">High</div>
              <div className="font-bold tabular text-foreground">{formatPrice(stock.entryHigh)}</div>
            </div>
          </div>
        </div>

        {/* Risk / Reward */}
        <div className="px-4 py-3 border-b border-border space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Risk / Reward</div>
          {[
            { label: "Stop Loss", value: formatPrice(stock.stopLoss), cls: "text-bear" },
            { label: "Target 1", value: formatPrice(stock.target1), cls: "text-bull" },
            { label: "Target 2", value: formatPrice(stock.target2), cls: "text-bull" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className={`tabular font-medium ${cls}`}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-1 border-t border-border">
            <span className="text-muted-foreground">R:R Ratio</span>
            <span className={`tabular font-bold ${stock.riskReward >= 2 ? "text-bull" : stock.riskReward >= 1.5 ? "text-neutral-amber" : "text-bear"}`}>
              1 : {stock.riskReward}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Risk Level</span>
            <RiskBadge level={stock.riskLevel} />
          </div>
        </div>

        {/* Indicators */}
        <div className="px-4 py-3 border-b border-border space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Indicators (Live)</div>
          {[
            { label: "RSI (14)", value: stock.rsi.toFixed(1), cls: stock.rsi > 70 ? "text-bear" : stock.rsi > 50 ? "text-bull" : "text-neutral-amber" },
            { label: "MACD", value: stock.macdSignal === "bull" ? "Bullish ✓" : stock.macdSignal === "neutral" ? "Neutral" : "Bearish", cls: stock.macdSignal === "bull" ? "text-bull" : stock.macdSignal === "bear" ? "text-bear" : "text-neutral-amber" },
            { label: "EMA Stack", value: stock.emaAlignment ? "Aligned ✓" : "Misaligned", cls: stock.emaAlignment ? "text-bull" : "text-muted-foreground" },
            { label: "Volume Ratio", value: `${stock.volumeRatio.toFixed(1)}x avg`, cls: stock.volumeRatio > 2 ? "text-bull" : "text-muted-foreground" },
            { label: "RS Rating", value: String(stock.rs), cls: "text-foreground" },
            { label: "To Breakout", value: `${stock.distToBreakout.toFixed(1)}%`, cls: "text-foreground" },
            { label: "Consolidation", value: `${stock.consolidationDays}d`, cls: "text-foreground" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className={`font-medium ${cls}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Confirmations */}
        <div className="px-4 py-3 border-b border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Confirmation Signals ({stock.confirmations.length})
          </div>
          <div className="space-y-1">
            {stock.confirmations.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: "hsl(152,80%,50%)" }} />
                <span className="text-foreground">{c}</span>
              </div>
            ))}
            {stock.confirmations.length === 0 && (
              <div className="text-xs text-muted-foreground">No strong signals yet</div>
            )}
          </div>
        </div>

        {/* Signal Flags */}
        <div className="px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Signal Flags</div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Unusual Vol", active: stock.unusualVolume },
              { label: "Accumulating", active: stock.isAccumulating },
              { label: "Vol Squeeze", active: stock.volatilitySqueezing },
              { label: "+News", active: stock.newsPositive },
              { label: "Pre-mkt Str", active: stock.premarket },
              { label: "Near Level", active: stock.nearKeyLevel },
            ].map(({ label, active }) => (
              <div key={label}
                className={`px-2 py-1 rounded text-xs text-center ${active ? "badge-bull" : "bg-accent text-muted-foreground"}`}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* News & Sentiment */}
        <div className="px-4 py-3 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            News & Sentiment
          </div>
          <div className="space-y-2">
            {/* Sentiment score bar */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sentiment</span>
              <span className={`font-medium ${stock.sentimentScore > 0 ? "text-bull" : stock.sentimentScore < 0 ? "text-bear" : "text-neutral-amber"}`}>
                {stock.sentimentScore > 0 ? "+" : ""}{stock.sentimentScore} ({stock.sentimentLabel})
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">News Volume</span>
              <span className="text-foreground">{stock.newsVolume} articles ({stock.newsVolumeLabel})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Social Buzz</span>
              <div className="flex items-center gap-1.5">
                <div className="signal-bar-track w-12">
                  <div className="signal-bar-fill" style={{ width: `${stock.socialBuzz}%`, background: stock.socialBuzz >= 60 ? "hsl(152,80%,45%)" : stock.socialBuzz >= 30 ? "hsl(40,90%,52%)" : "hsl(var(--color-surface-4))" }} />
                </div>
                <span className="text-xs tabular text-foreground">{stock.socialBuzz}</span>
              </div>
            </div>
            {/* Analyst signal */}
            {stock.analystSignal && (
              <div className="px-2 py-1.5 rounded text-xs flex items-start gap-2" style={{ background: stock.analystSignal.type === "upgrade" || stock.analystSignal.type === "target_raise" ? "hsl(152 80% 42% / 0.1)" : "hsl(0 72% 51% / 0.1)", border: `1px solid ${stock.analystSignal.type === "upgrade" || stock.analystSignal.type === "target_raise" ? "hsl(152 80% 42% / 0.25)" : "hsl(0 72% 51% / 0.25)"}`, color: stock.analystSignal.type === "upgrade" || stock.analystSignal.type === "target_raise" ? "hsl(152 80% 55%)" : "hsl(0 72% 65%)" }}>
                <span className="flex-shrink-0">{stock.analystSignal.type === "upgrade" || stock.analystSignal.type === "target_raise" ? "📈" : "📉"}</span>
                <span>{stock.analystSignal.detail}</span>
              </div>
            )}
            {/* Earnings signal */}
            {stock.earningsSignal && (
              <div className="px-2 py-1.5 rounded text-xs flex items-start gap-2" style={{ background: stock.earningsSignal.type === "beat" ? "hsl(152 80% 42% / 0.1)" : "hsl(0 72% 51% / 0.1)", border: `1px solid ${stock.earningsSignal.type === "beat" ? "hsl(152 80% 42% / 0.25)" : "hsl(0 72% 51% / 0.25)"}`, color: stock.earningsSignal.type === "beat" ? "hsl(152 80% 55%)" : "hsl(0 72% 65%)" }}>
                <span className="flex-shrink-0">{stock.earningsSignal.type === "beat" ? "💰" : "⚠️"}</span>
                <span>{stock.earningsSignal.detail}</span>
              </div>
            )}
            {/* Catalysts */}
            {stock.catalysts && stock.catalysts.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Catalysts</div>
                <div className="flex flex-wrap gap-1">
                  {stock.catalysts.map((c: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-xs badge-watch">
                      {c.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Recent headlines */}
            {stock.newsArticles && stock.newsArticles.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Recent Headlines</div>
                <div className="space-y-1.5">
                  {stock.newsArticles.slice(0, 3).map((a: any, i: number) => (
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors">
                      <div className="flex items-start gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${a.sentiment === "positive" ? "bg-green-400" : a.sentiment === "negative" ? "bg-red-400" : "bg-yellow-400"}`} />
                        <div>
                          <div className="text-foreground leading-snug">{a.title.length > 80 ? a.title.slice(0, 80) + "…" : a.title}</div>
                          <div className="text-muted-foreground mt-0.5">{a.publisher} · {new Date(a.publishedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Options Signal */}
        {stock.optionsSignal && (
          <div className="px-4 py-3 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              Options Signal
              {stock.optionsSignal.direction !== "no_trade" && (
                <OptionsSignalBadge signal={stock.optionsSignal} />
              )}
            </div>

            {stock.optionsSignal.direction === "no_trade" ? (
              <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "hsl(40 90% 52% / 0.1)", border: "1px solid hsl(40 90% 52% / 0.25)", color: "hsl(40 90% 62%)" }}>
                <strong>No Trade</strong> — signals are conflicted. Wait for a clearer setup before buying options.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Direction card */}
                <div className="rounded-lg p-3 text-sm" style={{
                  background: stock.optionsSignal.direction === "call" ? "hsl(152 80% 42% / 0.12)" : "hsl(0 72% 51% / 0.12)",
                  border: `1px solid ${stock.optionsSignal.direction === "call" ? "hsl(152 80% 42% / 0.35)" : "hsl(0 72% 51% / 0.35)"}`,
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-foreground text-base">
                      {stock.optionsSignal.direction === "call" ? "▲ BUY CALL" : "▼ BUY PUT"}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${stock.optionsSignal.confidence === "high" ? "badge-bull" : stock.optionsSignal.confidence === "medium" ? "badge-neutral" : "badge-bear"}`}>
                      {stock.optionsSignal.confidence.toUpperCase()} confidence
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">Score: {stock.optionsSignal.confidenceScore}/100</div>
                </div>

                {/* Contract recommendation */}
                {stock.optionsSignal.recommendedStrike && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground">Recommended Contract</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Strike", value: `$${stock.optionsSignal.recommendedStrike}` },
                        { label: "Expiry", value: stock.optionsSignal.recommendedExpiry ?? "~10 days" },
                        { label: "Delta Target", value: stock.optionsSignal.deltaTarget },
                        { label: "Expected Move", value: `${stock.optionsSignal.targetMove && stock.optionsSignal.targetMove > 0 ? "+" : ""}${stock.optionsSignal.targetMove}% on stock` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-accent rounded px-2 py-1.5">
                          <div className="text-xs text-muted-foreground">{label}</div>
                          <div className="text-xs font-medium text-foreground">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entry / Exit timing */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-muted-foreground">Entry & Exit</div>
                  <div className="text-xs text-foreground px-2 py-1.5 rounded bg-accent">
                    <span className="text-muted-foreground">Entry: </span>{stock.optionsSignal.entryTiming}
                  </div>
                  <div className="text-xs text-foreground px-2 py-1.5 rounded bg-accent">
                    <span className="text-muted-foreground">Exit: </span>{stock.optionsSignal.exitTiming}
                  </div>
                </div>

                {/* Why this signal */}
                {stock.optionsSignal.rationale.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Why {stock.optionsSignal.direction === "call" ? "Call" : "Put"}?</div>
                    <div className="space-y-1">
                      {stock.optionsSignal.rationale.slice(0, 4).map((r: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <span className={`flex-shrink-0 font-bold ${stock.optionsSignal.direction === "call" ? "text-bull" : "text-bear"}`}>
                            {stock.optionsSignal.direction === "call" ? "▲" : "▼"}
                          </span>
                          <span className="text-foreground">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {stock.optionsSignal.warnings.length > 0 && (
                  <div className="px-2 py-1.5 rounded text-xs space-y-1" style={{ background: "hsl(40 90% 52% / 0.08)", border: "1px solid hsl(40 90% 52% / 0.2)" }}>
                    <div className="font-semibold text-neutral-amber mb-1">⚠ Caution</div>
                    {stock.optionsSignal.warnings.map((w: string, i: number) => (
                      <div key={i} className="text-neutral-amber">{w}</div>
                    ))}
                  </div>
                )}

                {/* Max loss + IV guidance */}
                <div className="px-2 py-1.5 rounded text-xs" style={{ background: "hsl(210 90% 60% / 0.08)", border: "1px solid hsl(210 90% 60% / 0.2)", color: "hsl(210 90% 65%)" }}>
                  <div className="font-semibold mb-1">Max Loss</div>
                  <div>{stock.optionsSignal.maxLoss}</div>
                  <div className="mt-1 font-semibold">IV Check</div>
                  <div>{stock.optionsSignal.ivGuidance}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KPI Cards ─────────────────────────────────────────────
function KPICards({ stocks }: { stocks: ScannerStock[] }) {
  const bullCount = stocks.filter(s => s.score >= 70).length;
  const avgScore = stocks.length > 0 ? Math.round(stocks.reduce((a, s) => a + s.score, 0) / stocks.length) : 0;
  const unusualVol = stocks.filter(s => s.unusualVolume).length;
  const nearBreakout = stocks.filter(s => s.distToBreakout < 4).length;

  const kpis = [
    { label: "High Score Setups", value: bullCount, suffix: " stocks", delta: "Score ≥ 70", up: true, icon: TrendingUp, color: "text-bull" },
    { label: "Avg Composite Score", value: avgScore, suffix: "/100", delta: "Live indicators", up: true, icon: BarChart2, color: "text-blue-accent" },
    { label: "Unusual Volume", value: unusualVol, suffix: " stocks", delta: "2x+ average", up: true, icon: Volume2, color: "text-neutral-amber" },
    { label: "Near Breakout", value: nearBreakout, suffix: " stocks", delta: "< 4% to resistance", up: true, icon: Zap, color: "text-purple-accent" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 px-4 py-3">
      {kpis.map(({ label, value, suffix, delta, up, icon: Icon, color }) => (
        <div key={label} className="kpi-card" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <Icon size={14} className={color} />
          </div>
          <div className="flex items-end gap-1">
            <span className={`kpi-value ${color}`}>{value}</span>
            <span className="text-sm text-muted-foreground mb-0.5">{suffix}</span>
          </div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${up ? "kpi-delta-up" : "kpi-delta-down"}`}>
            <ChevronUp size={11} />
            {delta}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton loader ────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="px-4 py-2 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 rounded bg-muted animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
      ))}
      <div className="text-xs text-center text-muted-foreground py-4 flex items-center justify-center gap-2">
        <Loader2 size={14} className="animate-spin text-primary" />
        <span>Fetching real-time data from Polygon.io…</span>
        <span className="text-muted-foreground opacity-60">(~30s on free plan)</span>
      </div>
    </div>
  );
}

// ─── Main Scanner Page ─────────────────────────────────────
type FilterMode = "all" | SetupType;
type SortKey = "score" | "volumeRatio" | "rs" | "rsi" | "change" | "distToBreakout";

export default function ScannerPage() {
  const [selected, setSelected] = useState<ScannerStock | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"beginner" | "advanced">("advanced");
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Fetch scan data ────────────────────────────────────
  const { data: scanResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["/api/scan"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/scan");
      return res.json();
    },
    refetchInterval: 15 * 60 * 1000, // auto-refresh every 15 min
    staleTime: 10 * 60 * 1000,
  });

  const stocks: ScannerStock[] = scanResponse?.data ?? [];
  const scanStatus: string = isLoading ? "loading" : (scanResponse?.status ?? "ok");
  const scanMessage: string | undefined = scanResponse?.message;
  const fetchedAt: number | undefined = scanResponse?.fetchedAt;
  const isScanRefreshing = scanResponse?.status === "refreshing";
  // Free-tier backend returns { truncated: true, totalAvailable: N, tier: 'free' }.
  // Show an upgrade banner so users know the list is limited — don't hide it silently.
  const isTruncated: boolean = scanResponse?.truncated === true;
  const totalAvailable: number | undefined = scanResponse?.totalAvailable;

  // ── Poll for status while refreshing ──────────────────
  useEffect(() => {
    if (isScanRefreshing) {
      const interval = setInterval(() => refetch(), 5000);
      return () => clearInterval(interval);
    }
  }, [isScanRefreshing, refetch]);

  // ── Filter & Sort ──────────────────────────────────────
  const filtered = useMemo(() => {
    let data = filterMode === "all" ? stocks : stocks.filter(s => s.setupType === filterMode);
    return [...data].sort((a, b) => {
      const mult = sortDir === "desc" ? -1 : 1;
      return (a[sortKey] - b[sortKey]) * mult;
    });
  }, [stocks, filterMode, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <Minus size={10} className="opacity-30" />;
    return sortDir === "desc" ? <ChevronDown size={10} /> : <ChevronUp size={10} />;
  }

  async function handleForceRefresh() {
    try {
      await apiRequest("POST", "/api/scan/refresh");
      toast({ title: "Scan triggered", description: "Fetching fresh data from Polygon — takes ~30s" });
      setTimeout(() => refetch(), 5000);
    } catch {
      toast({ title: "Error triggering refresh", variant: "destructive" });
    }
  }

  async function handleAddWatchlist(stock: ScannerStock) {
    try {
      await apiRequest("POST", "/api/watchlist", {
        ticker: stock.ticker,
        name: stock.name,
        priority: stock.watchlistPriority === "A" ? "high" : stock.watchlistPriority === "B" ? "medium" : "low",
        note: `Setup: ${SETUP_LABELS[stock.setupType]} | Score: ${stock.score}`,
        addedAt: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: `${stock.ticker} added to watchlist`, description: `Priority: ${stock.watchlistPriority}` });
    } catch {
      toast({ title: "Error adding to watchlist", variant: "destructive" });
    }
  }

  const FILTERS: { key: FilterMode; label: string }[] = [
    { key: "all", label: "All Setups" },
    { key: "breakout", label: "Breakout" },
    { key: "accumulation", label: "Accumulation" },
    { key: "squeeze", label: "Vol Squeeze" },
    { key: "momentum", label: "Momentum" },
  ];

  // ── Last updated label ─────────────────────────────────
  const lastUpdatedLabel = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      {/* Header */}
      <header className="dashboard-header px-4 flex items-center justify-between" style={{ minHeight: 56 }}>
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-foreground">Momentum Scanner</h1>
          <span className="text-xs text-muted-foreground">
            {stocks.length} stocks ·{" "}
            {lastUpdatedLabel
              ? <span className="text-primary">live data · {lastUpdatedLabel}</span>
              : <span className="text-muted-foreground">loading…</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-border text-xs">
            {(["beginner", "advanced"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                data-testid={`view-${m}`}
                className={`px-3 py-1.5 transition-colors ${viewMode === m ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs"
            onClick={handleForceRefresh} disabled={isFetching || isScanRefreshing}>
            <RefreshCw size={12} className={isFetching || isScanRefreshing ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </header>

      {/* KPI Row */}
      <KPICards stocks={stocks} />

      {/* Status banner */}
      <StatusBanner status={scanStatus} message={scanMessage} fetchedAt={fetchedAt} inProgress={isScanRefreshing} />

      {/* Free-tier upgrade banner — shown when backend truncates the scan list */}
      {isTruncated && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <span>
              Showing top <strong>{stocks.length}</strong> of{" "}
              <strong>{totalAvailable ?? "all"}</strong> momentum candidates.
              Upgrade to Pro to see the full scan, unlock Watchlist &amp; Backtester.
            </span>
          </div>
          <Button
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => { window.location.hash = "#/pricing"; }}
            data-testid="upgrade-pro-cta"
          >
            Upgrade to Pro
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-muted-foreground" />
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilterMode(f.key)}
            data-testid={`filter-${f.key}`}
            className={`px-3 py-1 rounded-full text-xs transition-all border ${
              filterMode === f.key
                ? "bg-primary/15 text-primary border-primary/30 font-medium"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} results</span>
      </div>

      {/* Table + Detail Panel */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto overscroll-contain">
          {isLoading && stocks.length === 0 ? (
            <TableSkeleton />
          ) : (
            <table className="scanner-table w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-3 py-2 text-left w-8">#</th>
                  <th className="px-3 py-2 text-left">Ticker</th>
                  {viewMode === "advanced" && (
                    <th className="px-2 py-2 text-right cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("change")}>
                      <span className="flex items-center justify-end gap-1">Chg% <SortIcon k="change" /></span>
                    </th>
                  )}
                  <th className="px-2 py-2 text-center cursor-pointer select-none hover:text-foreground"
                    onClick={() => toggleSort("score")}>
                    <span className="flex items-center justify-center gap-1">Score <SortIcon k="score" /></span>
                  </th>
                  {viewMode === "advanced" && (
                    <>
                      <th className="px-2 py-2 text-right cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort("volumeRatio")}>
                        <span className="flex items-center justify-end gap-1">Vol Ratio <SortIcon k="volumeRatio" /></span>
                      </th>
                      <th className="px-2 py-2 text-right cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort("rsi")}>
                        <span className="flex items-center justify-end gap-1">RSI <SortIcon k="rsi" /></span>
                      </th>
                      <th className="px-2 py-2 text-right cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort("rs")}>
                        <span className="flex items-center justify-end gap-1">RS <SortIcon k="rs" /></span>
                      </th>
                      <th className="px-2 py-2 text-center">Sent</th>
                      <th className="px-2 py-2 text-center">Signal</th>
                    </>
                  )}
                  <th className="px-2 py-2 text-left">Setup</th>
                  {viewMode === "advanced" && (
                    <th className="px-2 py-2 text-right cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort("distToBreakout")}>
                      <span className="flex items-center justify-end gap-1">To BO <SortIcon k="distToBreakout" /></span>
                    </th>
                  )}
                  <th className="px-2 py-2 text-right">Entry</th>
                  <th className="px-2 py-2 text-right">Stop</th>
                  {viewMode === "advanced" && <th className="px-2 py-2 text-right">R:R</th>}
                  <th className="px-2 py-2 text-center">Risk</th>
                  {viewMode === "advanced" && <th className="px-2 py-2 text-center">Chart</th>}
                  <th className="px-2 py-2 text-center">Prio</th>
                  <th className="px-2 py-2 text-center">Add</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const isSelected = selected?.ticker === s.ticker;
                  const changeColor = s.change >= 0 ? "text-bull" : "text-bear";
                  return (
                    <tr key={s.ticker}
                      className={`scanner-row border-b border-border/50 ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelected(isSelected ? null : s)}
                      data-testid={`row-${s.ticker}`}>
                      <td className="px-3 py-2.5 text-muted-foreground tabular">{s.rank}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-foreground">{s.ticker}</div>
                        <div className="text-muted-foreground text-xs opacity-70 truncate max-w-[100px]">{s.sector}</div>
                      </td>
                      {viewMode === "advanced" && (
                        <td className={`px-2 py-2.5 text-right tabular font-medium ${changeColor}`}>
                          {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                        </td>
                      )}
                      <td className="px-2 py-2.5 text-center"><ScoreRing score={s.score} /></td>
                      {viewMode === "advanced" && (
                        <>
                          <td className="px-2 py-2.5 text-right">
                            <div className={`tabular font-medium ${s.volumeRatio > 2 ? "text-bull" : "text-foreground"}`}>
                              {s.volumeRatio.toFixed(1)}x
                            </div>
                            <div className="text-muted-foreground">{formatVolume(s.volume)}</div>
                          </td>
                          <td className={`px-2 py-2.5 text-right tabular ${s.rsi > 70 ? "text-bear" : s.rsi > 50 ? "text-bull" : "text-neutral-amber"}`}>
                            {s.rsi.toFixed(1)}
                          </td>
                          <td className={`px-2 py-2.5 text-right tabular font-medium ${s.rs >= 80 ? "text-bull" : s.rs >= 60 ? "text-neutral-amber" : "text-muted-foreground"}`}>
                            {s.rs}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <SentimentBadge score={s.sentimentScore} label={s.sentimentLabel} />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <OptionsSignalBadge signal={s.optionsSignal} />
                          </td>
                        </>
                      )}
                      <td className="px-2 py-2.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${SETUP_COLORS[s.setupType]}`}>
                          {SETUP_LABELS[s.setupType]}
                        </span>
                      </td>
                      {viewMode === "advanced" && (
                        <td className={`px-2 py-2.5 text-right tabular ${s.distToBreakout < 3 ? "text-bull font-medium" : "text-foreground"}`}>
                          {s.distToBreakout.toFixed(1)}%
                        </td>
                      )}
                      <td className="px-2 py-2.5 text-right">
                        <div className="tabular text-foreground">{formatPrice(s.entryLow)}</div>
                        <div className="tabular text-muted-foreground text-xs">{formatPrice(s.entryHigh)}</div>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular text-bear">{formatPrice(s.stopLoss)}</td>
                      {viewMode === "advanced" && (
                        <td className={`px-2 py-2.5 text-right tabular font-medium ${s.riskReward >= 2 ? "text-bull" : s.riskReward >= 1.5 ? "text-neutral-amber" : "text-bear"}`}>
                          {s.riskReward}
                        </td>
                      )}
                      <td className="px-2 py-2.5 text-center"><RiskBadge level={s.riskLevel} /></td>
                      {viewMode === "advanced" && (
                        <td className="px-2 py-2.5 text-center">
                          <Sparkline data={s.priceHistory}
                            color={s.change >= 0 ? "hsl(152,80%,50%)" : "hsl(0,72%,60%)"} />
                        </td>
                      )}
                      <td className="px-2 py-2.5 text-center"><PriorityBadge p={s.watchlistPriority} /></td>
                      <td className="px-2 py-2.5 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddWatchlist(s); }}
                          className="p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors"
                          data-testid={`btn-watch-${s.ticker}`} title="Add to watchlist">
                          <Plus size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={20} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      No stocks match this filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <DetailPanel stock={selected} onClose={() => setSelected(null)} onAddWatchlist={handleAddWatchlist} />
        )}
      </div>

      {/* Legend */}
      {viewMode === "beginner" && (
        <div className="px-4 py-2 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Info size={12} />
            <strong className="text-foreground">Score:</strong> 0-100 composite bullish strength (live)</span>
          <span><strong className="text-foreground">Entry:</strong> Buy zone (low to high)</span>
          <span><strong className="text-foreground">Stop:</strong> Exit if price falls below this</span>
          <span><strong className="text-foreground">Prio A/B/C:</strong> Watchlist urgency rank</span>
        </div>
      )}
    </div>
  );
}
