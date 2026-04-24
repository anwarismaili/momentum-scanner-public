import { useState } from "react";
import { Clock, Sun, TrendingUp, Activity, Moon, CheckCircle2, Circle } from "lucide-react";

interface WorkflowStep {
  time: string;
  title: string;
  tasks: string[];
  tip?: string;
  phase: "premarket" | "open" | "midday" | "close";
}

const BEGINNER_WORKFLOW: WorkflowStep[] = [
  {
    time: "7:30 AM",
    phase: "premarket",
    title: "Morning Market Context",
    tasks: [
      "Check S&P 500 and Nasdaq futures (red or green?)",
      "Scan news headlines for any market-moving events",
      "Check if your watchlist stocks have any overnight news",
    ],
    tip: "If futures are down >1%, reduce position size or wait. Market context is everything.",
  },
  {
    time: "8:00 AM",
    phase: "premarket",
    title: "Run the Pre-Market Scan",
    tasks: [
      "Open your scanner and sort by Score (highest first)",
      "Look for stocks gapping up with volume > 2x average",
      "Narrow to top 5 stocks — don't chase more than 5 at once",
    ],
    tip: "A stock gapping up with strong volume and positive news = your best candidate.",
  },
  {
    time: "9:00 AM",
    phase: "premarket",
    title: "Prepare Your Plan",
    tasks: [
      "For each top-5 stock, write down: entry price, stop loss, and target",
      "Set price alerts at the entry and stop levels",
      "Do NOT enter any trade before 9:45 AM — wait for the open to stabilize",
    ],
    tip: "Planning before the market opens removes emotional decisions during trading.",
  },
  {
    time: "9:45 AM",
    phase: "open",
    title: "Market Open — Watch & Confirm",
    tasks: [
      "Watch if your candidates are holding their gap or fading",
      "Look for price to consolidate for 10-15 min after the open",
      "Enter only when price breaks above the morning high on volume",
    ],
    tip: "The first 15 minutes are often chaotic. Patience at the open saves money.",
  },
  {
    time: "11:00 AM",
    phase: "midday",
    title: "Manage Open Positions",
    tasks: [
      "Check if any stock hit target 1 — consider taking partial profits",
      "If a position is up, move your stop loss to breakeven",
      "Avoid adding new positions between 11 AM - 2 PM (low momentum period)",
    ],
    tip: "Moving your stop to breakeven once up 5-8% makes a trade risk-free.",
  },
  {
    time: "3:00 PM",
    phase: "close",
    title: "End-of-Day Review",
    tasks: [
      "Review every trade: what worked, what didn't, and why",
      "Update your watchlist — add any new setups forming for tomorrow",
      "Note the market's overall strength for tomorrow's planning",
    ],
    tip: "Traders who review trades daily improve 3x faster than those who don't.",
  },
];

const ADVANCED_WORKFLOW: WorkflowStep[] = [
  {
    time: "6:30 AM",
    phase: "premarket",
    title: "Macro & Sector Context",
    tasks: [
      "Check VIX (fear index) — above 25 = reduce position size by 50%",
      "Review Fed calendar, economic data releases, earnings schedule",
      "Check overnight crypto, commodities, and foreign market moves",
      "Identify the strongest 1-2 sectors today via sector ETF performance",
    ],
    tip: "Sector rotation is your edge. Leading sectors have leading stocks within them.",
  },
  {
    time: "7:00 AM",
    phase: "premarket",
    title: "Scan Execution",
    tasks: [
      "Run pre-market scanner: score >75, RS rating >80, gap >3%, volume >200K premarket",
      "Cross-reference with options unusual flow from previous day",
      "Check short interest for any squeeze candidates in your scan results",
      "Filter: EMA alignment required + MACD bullish + consolidation <4% wide",
    ],
    tip: "Unusual options flow from yesterday often forecasts today's price action.",
  },
  {
    time: "7:45 AM",
    phase: "premarket",
    title: "Trade Plan & Risk Sizing",
    tasks: [
      "Assign A/B/C priority to each setup — focus capital on A-priority only",
      "Calculate exact position size: Risk $X = (Entry - Stop) × Shares",
      "Maximum risk per trade: 1-2% of total capital",
      "Set hard alerts at entry zone, stop, target 1, and target 2",
    ],
    tip: "Position sizing formula: Shares = (Account × 2%) ÷ (Entry − Stop)",
  },
  {
    time: "9:25 AM",
    phase: "premarket",
    title: "Level 2 & Order Flow Review",
    tasks: [
      "Check Level 2 quotes for your top setups — where is the ask wall?",
      "Watch tape for large block prints near support levels (institutional buying)",
      "Monitor pre-market support and resistance levels on the 5-min chart",
    ],
    tip: "Large prints at even dollar prices (like $100.00) often signal institutional orders.",
  },
  {
    time: "9:30–9:45 AM",
    phase: "open",
    title: "Opening Range Observation",
    tasks: [
      "Mark the first 5-min candle high and low — this is the Opening Range",
      "Do NOT trade the first 5-15 min unless there is a pre-planned gap-and-go",
      "Watch volume: does it confirm or deny the premarket move?",
      "Note any sector rotation happening in real-time",
    ],
    tip: "ORB (Opening Range Breakout): enter on confirmed break above 5-min high with volume.",
  },
  {
    time: "9:45–11:30 AM",
    phase: "open",
    title: "Primary Trade Window",
    tasks: [
      "Execute entries only when 3+ confirmations align: volume, price action, indicator",
      "Use tiered entries — 50% at zone low, 50% on confirmation above resistance",
      "Scale out: sell 1/3 at T1, trail stop on remaining 2/3",
      "Track real-time RS vs sector ETF — if stock lags sector, exit immediately",
    ],
    tip: "Best 90-minute window of the day. Most successful breakouts occur before 11 AM.",
  },
  {
    time: "11:30 AM–2:00 PM",
    phase: "midday",
    title: "Dead Zone Management",
    tasks: [
      "No new entries unless it is a very strong A-priority setup with catalyst",
      "Trail stops aggressively on existing positions — protect gains",
      "Use this time to update tomorrow's watchlist and research new setups",
      "Review which setups are still forming well for a power hour entry",
    ],
    tip: "Volume dries up at midday. Breakouts that fail often fail between 11 AM-2 PM.",
  },
  {
    time: "2:30–3:30 PM",
    phase: "close",
    title: "Power Hour Entries",
    tasks: [
      "Re-scan for any stocks making new intraday highs on rising volume",
      "Look for end-of-day accumulation (OBV rising, price holding VWAP)",
      "Enter only high-conviction setups with clear end-of-day momentum",
    ],
    tip: "Power hour (3-4 PM) has the 2nd highest volume of the day. Real moves happen here.",
  },
  {
    time: "4:00–4:30 PM",
    phase: "close",
    title: "End-of-Day Analysis",
    tasks: [
      "Journal every trade: entry reason, outcome, what you'd do differently",
      "Update RS ratings on watchlist stocks — are they holding relative strength?",
      "Check after-hours earnings for tomorrow's gap candidates",
      "Score your setups for tomorrow (A/B/C priority), update scanner watchlist",
    ],
    tip: "A trading journal reviewed weekly is the fastest path to consistent profitability.",
  },
];

const PHASE_CONFIG = {
  premarket: { label: "Pre-Market", icon: <Sun size={12} />, color: "hsl(40 90% 58%)", bg: "hsl(40 90% 52% / 0.1)" },
  open: { label: "Market Open", icon: <TrendingUp size={12} />, color: "hsl(152 80% 50%)", bg: "hsl(152 80% 42% / 0.1)" },
  midday: { label: "Midday", icon: <Activity size={12} />, color: "hsl(210 90% 65%)", bg: "hsl(210 90% 60% / 0.1)" },
  close: { label: "Market Close", icon: <Moon size={12} />, color: "hsl(270 70% 70%)", bg: "hsl(270 70% 65% / 0.1)" },
};

function WorkflowStep({ step, index }: { step: WorkflowStep; index: number }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const phase = PHASE_CONFIG[step.phase];
  const allDone = step.tasks.every((_, i) => checked[i]);

  return (
    <div className="workflow-step mb-6">
      <div className="step-dot" style={{ background: allDone ? "hsl(152 80% 42%)" : phase.bg, border: `1.5px solid ${allDone ? "hsl(152 80% 50%)" : phase.color}` }}>
        {allDone ? <CheckCircle2 size={12} style={{ color: "hsl(152 80% 60%)" }} /> : (
          <span style={{ color: phase.color, fontSize: "0.6rem", fontWeight: 700 }}>{index + 1}</span>
        )}
      </div>

      <div className="kpi-card">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">{step.title}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                style={{ background: phase.bg, color: phase.color, border: `1px solid ${phase.color}30` }}>
                {phase.icon} {phase.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock size={11} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground tabular">{step.time}</span>
            </div>
          </div>
          {allDone && <CheckCircle2 size={16} className="text-bull flex-shrink-0" />}
        </div>

        <div className="space-y-1.5 mb-2">
          {step.tasks.map((task, i) => (
            <label key={i} className="flex items-start gap-2 cursor-pointer group">
              <button
                onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
                className="mt-0.5 flex-shrink-0"
                data-testid={`task-${step.time.replace(":", "")}-${i}`}
              >
                {checked[i]
                  ? <CheckCircle2 size={14} className="text-bull" />
                  : <Circle size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />}
              </button>
              <span className={`text-sm transition-colors ${checked[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {task}
              </span>
            </label>
          ))}
        </div>

        {step.tip && (
          <div className="px-2 py-1.5 rounded text-xs flex items-start gap-2"
            style={{ background: "hsl(40 90% 52% / 0.08)", border: "1px solid hsl(40 90% 52% / 0.2)", color: "hsl(40 90% 62%)" }}>
            <span className="flex-shrink-0">💡</span>
            <span>{step.tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  const [mode, setMode] = useState<"beginner" | "advanced">("beginner");
  const workflow = mode === "beginner" ? BEGINNER_WORKFLOW : ADVANCED_WORKFLOW;

  const phases = ["premarket", "open", "midday", "close"] as const;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      <header className="dashboard-header px-4 flex items-center justify-between" style={{ minHeight: 56 }}>
        <div>
          <h1 className="text-sm font-bold text-foreground">Daily Workflow</h1>
          <div className="text-xs text-muted-foreground">{workflow.length} steps · check them off as you go</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-xs text-muted-foreground">
            {phases.map(phase => {
              const conf = PHASE_CONFIG[phase];
              const count = workflow.filter(s => s.phase === phase).length;
              return (
                <span key={phase} className="flex items-center gap-1" style={{ color: conf.color }}>
                  {conf.icon} {conf.label} ({count})
                </span>
              );
            })}
          </div>
          <div className="flex rounded-lg overflow-hidden border border-border text-xs">
            {(["beginner", "advanced"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                data-testid={`workflow-${m}`}
                className={`px-3 py-1.5 transition-colors ${mode === m ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="dashboard-main flex-1 px-4 py-4">
        <div className="max-w-2xl">
          {workflow.map((step, i) => (
            <WorkflowStep key={step.time + step.title} step={step} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
