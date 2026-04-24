import { useState } from "react";
import React from "react";
import {
  TrendingUp, Volume2, Zap, Shield, Activity, BarChart2,
  Search, Database, ChevronDown, ChevronRight
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: PlaybookItem[];
}

interface PlaybookItem {
  name: string;
  description: string;
  beginner?: boolean;
  advanced?: boolean;
  tip?: string;
}

const SECTIONS: Section[] = [
  {
    id: "indicators",
    title: "Best Indicators for Early Bullish Momentum",
    icon: <Activity size={16} />,
    color: "text-bull",
    items: [
      {
        name: "Volume Ratio (Vol/AvgVol)",
        description: "Compares today's volume to its 20-day average. A spike of 2x or more signals institutional buying or news. Look for volume expansion on up days.",
        beginner: true,
        tip: "Best signal: Price up + volume 3x+ = strong accumulation",
      },
      {
        name: "RSI (14-period)",
        description: "Measures momentum on a 0-100 scale. The sweet spot for entry is 50-65 — strong momentum but not yet overbought (70+). Avoid buying above 75.",
        beginner: true,
        tip: "RSI rising from 50 crossing above 60 = early momentum signal",
      },
      {
        name: "MACD (12,26,9)",
        description: "Tracks trend changes via moving average crossovers. A bullish MACD crossover (fast line crossing above signal line) is a powerful entry trigger.",
        beginner: true,
        tip: "Most powerful when MACD crosses above zero line from below",
      },
      {
        name: "EMA Stack (8/21/50)",
        description: "When price is above the 8 EMA, which is above the 21 EMA, which is above the 50 EMA — this 'stack alignment' signals a strong uptrend in progress.",
        beginner: true,
        tip: "Price bouncing off 21 EMA in an uptrend = high-probability entry",
      },
      {
        name: "Relative Strength (RS Rating)",
        description: "Measures a stock's price performance vs the S&P 500 over 52 weeks, scored 1-99. Focus on RS 80+ stocks — they outperform the market and lead bull runs.",
        beginner: true,
        tip: "RS rating rising before a breakout = stock under accumulation",
      },
      {
        name: "Bollinger Band Width (BBW)",
        description: "When bands contract (squeeze), it signals low volatility coiling before a big move. A breakout from a BB squeeze is often explosive.",
        advanced: true,
        tip: "BB squeeze below 20-day average bandwidth = imminent expansion",
      },
      {
        name: "On-Balance Volume (OBV)",
        description: "Tracks cumulative volume flow. When OBV rises while price consolidates sideways, it signals hidden accumulation — smart money buying before the move.",
        advanced: true,
        tip: "OBV making new highs while price is flat = strong divergence signal",
      },
      {
        name: "Anchored VWAP",
        description: "Volume-Weighted Average Price anchored to key dates (earnings, breakout). Price reclaiming or holding AVWAP shows institutional support zones.",
        advanced: true,
        tip: "Long entry: price bouncing off AVWAP with volume confirmation",
      },
      {
        name: "Average True Range (ATR)",
        description: "Measures daily price volatility. Use ATR to size your stop loss (1.5-2x ATR below entry) and set realistic targets. Tightening ATR signals a squeeze.",
        advanced: true,
        tip: "Set stop at entry − (1.5 × ATR14) for volatility-adjusted risk",
      },
    ],
  },
  {
    id: "filters",
    title: "Best Scan Filters (Intraday & Premarket)",
    icon: <Search size={16} />,
    color: "text-blue-accent",
    items: [
      {
        name: "Premarket Scan Filters",
        description: "Run these 30-60 min before open: Price gapper +3% or more with volume > 100K shares. Look for stocks with news catalysts, earnings beats, or sector moves.",
        beginner: true,
        tip: "Premarket gaps with thin volume often fade — wait for market open to confirm",
      },
      {
        name: "Volume Filter",
        description: "Minimum 500K average daily volume (reduces slippage). Current intraday volume > 2x the 5-day average at the same time of day (removes false signals).",
        beginner: true,
        tip: "For stocks over $100, average daily volume above 1M is preferred",
      },
      {
        name: "Price Range Filter",
        description: "Focus on $10-$500 stocks for most traders. Penny stocks (<$5) are manipulated. Stocks over $500 require large capital for position sizing.",
        beginner: true,
        tip: "Start with $20-$200 range for best liquidity and volatility balance",
      },
      {
        name: "Float Filter",
        description: "Low float stocks (under 50M shares) move faster on volume spikes. High float stocks (500M+) require massive institutional moves. Mid-float (50-200M) is safest.",
        advanced: true,
        tip: "Low float + unusual volume = explosive potential but higher risk",
      },
      {
        name: "Short Interest Filter",
        description: "Stocks with 20%+ short interest and positive news can trigger short squeezes — rapid price spikes as shorts cover. Combine with unusual volume for confirmation.",
        advanced: true,
        tip: "Short squeeze candidates: SI >20%, borrow rate high, positive catalyst",
      },
      {
        name: "Intraday Momentum Filter",
        description: "At 9:30-10:30 AM: price making new intraday highs with volume > 1.5x average for that time period. The first 30-60 minutes set the day's trend.",
        beginner: true,
        tip: "9:30-10:30 AM is the most volatile and highest-volume window — best entries",
      },
      {
        name: "Sector Momentum Filter",
        description: "Find the strongest sector on any given day (check sector ETFs: XLK, XLE, XBI, etc.) and scan for the top-ranked stocks within that sector.",
        advanced: true,
        tip: "Strong stocks in strong sectors outperform random momentum plays",
      },
      {
        name: "Consolidation / Base Filter",
        description: "Stocks that have been trading in a tight range for 3-8 weeks with shrinking volume are building energy for a move. Add the distance-to-breakout filter (<5%).",
        advanced: true,
        tip: "Flat base for 5+ weeks with volume drying up = institutional accumulation",
      },
    ],
  },
  {
    id: "platforms",
    title: "Data Sources & Platforms",
    icon: <Database size={16} />,
    color: "text-neutral-amber",
    items: [
      {
        name: "Finviz (finviz.com)",
        description: "Best free stock screener. Use the Elite version ($25/mo) for real-time scans. Filter by volume, RS, price, sector, and technical patterns.",
        beginner: true,
        tip: "Finviz screener: set Volume > 1M, EPS growth > 20%, RS Rating > 80",
      },
      {
        name: "TradingView",
        description: "Best charting platform. Use Pine Script to build custom screeners. Has a built-in stock screener with technical conditions. Free tier works for basics.",
        beginner: true,
        tip: "Set alerts on key price levels to get notified without watching all day",
      },
      {
        name: "Trade Ideas",
        description: "The most powerful real-time scanner ($228/mo). Has AI-powered alerts, pre-built scans for gaps, volume spikes, and momentum. Used by professional traders.",
        advanced: true,
        tip: "Holly AI scans can teach you what high-quality setups look like automatically",
      },
      {
        name: "Unusual Whales / Market Chameleon",
        description: "Track unusual options activity — large call or put sweeps signal that institutional traders are positioning before a move. Options flow often leads price.",
        advanced: true,
        tip: "Large call sweeps above ask on weekly options = bullish institutional bet",
      },
      {
        name: "MarketSmith (IBD)",
        description: "The gold standard for RS ratings and base patterns (IBD methodology). Costs $40-$80/mo but gives the most reliable relative strength data and pattern recognition.",
        advanced: true,
        tip: "Focus on stocks with RS Rating 80+ that are forming cup-and-handle or flat bases",
      },
      {
        name: "StockBeep / Benzinga Pro",
        description: "Real-time news alerts are critical for catalyst-driven moves. Benzinga Pro ($30-$200/mo) delivers news faster than most free sources.",
        beginner: true,
        tip: "Set alerts for earnings beats, FDA approvals, contract wins for your watchlist",
      },
      {
        name: "TD Ameritrade / thinkorswim",
        description: "Free platform with powerful built-in scanner (thinkScript). Can scan for all technical conditions in real time during market hours.",
        beginner: true,
        tip: "Use the built-in 'Swing Trade' scans as a starting template",
      },
    ],
  },
  {
    id: "structure",
    title: "Dashboard Structure",
    icon: <BarChart2 size={16} />,
    color: "text-purple-accent",
    items: [
      {
        name: "Beginner Layout (3-panel)",
        description: "Panel 1: Scanner table (score, ticker, setup type, entry, stop). Panel 2: Single stock detail view (entry zone, risk level, key signals). Panel 3: Watchlist with A/B/C priority.",
        beginner: true,
        tip: "Simplify until you can make a go/no-go decision in under 30 seconds per stock",
      },
      {
        name: "Advanced Layout (5-panel)",
        description: "Top row: 4 KPI cards (high-score setups, avg score, unusual volume, near breakout). Left: sortable scanner table with sparklines. Center: detail panel with charts, indicators, R:R. Right: watchlist and notes. Bottom: sector heatmap.",
        advanced: true,
        tip: "Use the scanner as your input, the detail panel as your decision maker",
      },
      {
        name: "Scoring System (0-100)",
        description: "Composite score weights: Volume spike (25pts), Momentum/RSI (20pts), Trend/EMA (20pts), Relative Strength (15pts), Setup pattern (10pts), News/Catalyst (10pts).",
        beginner: true,
        tip: "Focus only on scores above 70. Below 60 = skip, wait for a better setup",
      },
      {
        name: "Watchlist Priority System",
        description: "Priority A (score 80+): Imminent setup, ready to enter on confirmation. Priority B (60-79): Building, needs one more signal. Priority C (40-59): Keep watching, not yet ready.",
        beginner: true,
        tip: "Limit A-priority stocks to 5-7 at a time. More than that and you miss entries",
      },
    ],
  },
];

function CollapsibleSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="kpi-card mb-3">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setOpen(o => !o)}
        data-testid={`section-${section.id}`}
      >
        <div className="flex items-center gap-2">
          <span className={section.color}>{section.icon}</span>
          <span className="font-semibold text-foreground text-sm">{section.title}</span>
          <span className="text-xs text-muted-foreground">({section.items.length} items)</span>
        </div>
        {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {section.items.map((item, i) => (
            <div key={i} className="border border-border rounded-lg p-3 animate-in">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-medium text-sm text-foreground">{item.name}</div>
                <div className="flex gap-1 flex-shrink-0">
                  {item.beginner && (
                    <span className="badge-watch px-1.5 py-0.5 rounded text-xs">Beginner</span>
                  )}
                  {item.advanced && (
                    <span className="badge-bear px-1.5 py-0.5 rounded text-xs" style={{ background: "hsl(270 70% 65% / 0.15)", color: "hsl(270 70% 70%)", border: "1px solid hsl(270 70% 65% / 0.3)" }}>Advanced</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              {item.tip && (
                <div className="mt-2 px-2 py-1.5 rounded text-xs flex items-start gap-2"
                  style={{ background: "hsl(40 90% 52% / 0.08)", border: "1px solid hsl(40 90% 52% / 0.2)", color: "hsl(40 90% 62%)" }}>
                  <Zap size={11} className="mt-0.5 flex-shrink-0" />
                  <span>{item.tip}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlaybookPage() {
  const [filter, setFilter] = useState<"all" | "beginner" | "advanced">("all");

  const filteredSections: Section[] = SECTIONS.map(section => ({
    ...section,
    items: filter === "all" ? section.items
      : filter === "beginner" ? section.items.filter(i => i.beginner)
      : section.items.filter(i => i.advanced),
  })).filter(s => s.items.length > 0);

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      <header className="dashboard-header px-4 flex items-center justify-between" style={{ minHeight: 56 }}>
        <h1 className="text-sm font-bold text-foreground">Trading Playbook</h1>
        <div className="flex rounded-lg overflow-hidden border border-border text-xs">
          {(["all", "beginner", "advanced"] as const).map(m => (
            <button key={m} onClick={() => setFilter(m)}
              data-testid={`playbook-filter-${m}`}
              className={`px-3 py-1.5 transition-colors ${filter === m ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="dashboard-main flex-1 px-4 py-4">
        <div className="max-w-4xl">
          {filteredSections.map(section => (
            <CollapsibleSection key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}
