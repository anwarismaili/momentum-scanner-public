// ============================================================
// UTILITY FORMATTERS (used across live and mock views)
// ============================================================

export type SignalStrength = "strong" | "moderate" | "weak";
export type RiskLevel = "low" | "medium" | "high";
export type SetupType = "breakout" | "accumulation" | "momentum" | "reversal" | "squeeze";

export interface StockSignal {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;           // % change today
  score: number;            // 0-100 composite bullish score
  rank: number;
  // Volume
  volume: number;
  avgVolume: number;
  volumeRatio: number;      // current / avg
  // Momentum
  rsi: number;
  macdSignal: "bull" | "neutral" | "bear";
  emaAlignment: boolean;    // 8 > 21 > 50 EMA
  // Breakout
  nearKeyLevel: boolean;
  distToBreakout: number;   // % to next resistance
  consolidationDays: number;
  // Relative Strength
  rs: number;               // RS vs SPY (1-100)
  rsRank: "top10" | "top25" | "top50" | "below";
  // Setup
  setupType: SetupType;
  // Entry / Risk
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: number;
  riskLevel: RiskLevel;
  // Signals
  unusualVolume: boolean;
  isAccumulating: boolean;
  volatilitySqueezing: boolean;
  newsPositive: boolean;
  premarket: boolean;       // showed strength premarket
  // Chart data (last 20 bars)
  priceHistory: number[];
  volumeHistory: number[];
  // Confirmation signals
  confirmations: string[];
  watchlistPriority: "A" | "B" | "C";
}

// Seeded random for determinism per session
let seed = 42;
function rand(min: number, max: number): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  const t = ((seed >>> 0) / 0xffffffff);
  return min + t * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function generatePriceHistory(base: number, trend: "up" | "flat" | "squeeze"): number[] {
  const bars: number[] = [];
  let p = base * (0.88 + rand(0, 0.08));
  for (let i = 0; i < 20; i++) {
    if (trend === "up") {
      p += p * (rand(-0.008, 0.022));
    } else if (trend === "squeeze") {
      const range = 0.006 - (i * 0.0002);
      p += p * (rand(-range, range));
    } else {
      p += p * (rand(-0.012, 0.016));
    }
    bars.push(parseFloat(p.toFixed(2)));
  }
  return bars;
}

function generateVolumeHistory(avg: number, spike: boolean): number[] {
  const bars: number[] = [];
  for (let i = 0; i < 20; i++) {
    const isSpike = spike && i >= 18;
    const multiplier = isSpike ? rand(2.2, 4.8) : rand(0.6, 1.4);
    bars.push(Math.floor(avg * multiplier));
  }
  return bars;
}

const STOCKS_RAW = [
  { ticker: "NVDA", name: "NVIDIA Corp", sector: "Semiconductors", price: 887.42 },
  { ticker: "SMCI", name: "Super Micro Computer", sector: "Server Hardware", price: 741.15 },
  { ticker: "ARM",  name: "Arm Holdings", sector: "Semiconductors", price: 148.30 },
  { ticker: "PLTR", name: "Palantir Technologies", sector: "AI / Software", price: 24.87 },
  { ticker: "MSTR", name: "MicroStrategy", sector: "Fintech / Crypto", price: 1640.50 },
  { ticker: "CRWD", name: "CrowdStrike", sector: "Cybersecurity", price: 312.70 },
  { ticker: "TSLA", name: "Tesla Inc", sector: "EV / Energy", price: 178.20 },
  { ticker: "AXON", name: "Axon Enterprise", sector: "Defense Tech", price: 258.40 },
  { ticker: "META", name: "Meta Platforms", sector: "Social / AI", price: 502.15 },
  { ticker: "IONQ", name: "IonQ Inc", sector: "Quantum Computing", price: 18.45 },
  { ticker: "APP",  name: "AppLovin Corp", sector: "Ad Tech", price: 89.60 },
  { ticker: "COIN", name: "Coinbase Global", sector: "Crypto Exchange", price: 241.80 },
  { ticker: "RKLB", name: "Rocket Lab USA", sector: "Space Tech", price: 22.35 },
  { ticker: "GTLB", name: "GitLab Inc", sector: "DevOps", price: 58.90 },
  { ticker: "CELH", name: "Celsius Holdings", sector: "Beverage / Health", price: 43.20 },
];

const SETUP_TYPES: SetupType[] = ["breakout", "accumulation", "momentum", "reversal", "squeeze"];
const SECTORS_MAP: Record<string, string> = {};

function buildConfirmations(s: Partial<StockSignal>): string[] {
  const c: string[] = [];
  if (s.volumeRatio! > 2) c.push("Volume 2x+ average");
  if (s.emaAlignment) c.push("EMA stack aligned (8>21>50)");
  if (s.rsi! > 50 && s.rsi! < 70) c.push("RSI in momentum zone (50-70)");
  if (s.macdSignal === "bull") c.push("MACD bullish crossover");
  if (s.unusualVolume) c.push("Unusual volume detected");
  if (s.isAccumulating) c.push("Accumulation pattern forming");
  if (s.volatilitySqueezing) c.push("Bollinger Band squeeze");
  if (s.newsPositive) c.push("Positive catalyst / news");
  if (s.premarket) c.push("Pre-market strength");
  if (s.rs! >= 85) c.push("RS Rating: top 10% vs market");
  if (s.distToBreakout! < 3) c.push("Within 3% of key resistance");
  return c;
}

export function generateScannerData(): StockSignal[] {
  seed = 42; // Reset for determinism
  return STOCKS_RAW.map((raw, i) => {
    const score = Math.max(38, Math.min(99, 95 - i * 4.5 + rand(-3, 3)));
    const rsi = rand(48, 74);
    const volumeRatio = rand(1.4, 5.2);
    const avgVol = randInt(800000, 12000000);
    const change = rand(-0.8, 6.4);
    const price = raw.price * (1 + change / 100);
    const macdSignal: "bull" | "neutral" | "bear" = score > 70 ? "bull" : score > 50 ? "neutral" : "bear";
    const emaAlignment = score > 62;
    const rs = Math.min(99, score + rand(-8, 12));
    const unusualVolume = volumeRatio > 2.5;
    const isAccumulating = i < 9;
    const volatilitySqueezing = [2, 5, 8, 12].includes(i);
    const newsPositive = [0, 3, 6, 10].includes(i);
    const premarket = [0, 1, 4, 7, 11].includes(i);
    const setupType = SETUP_TYPES[i % SETUP_TYPES.length];
    const distToBreakout = rand(0.5, 8.5);
    const consolidationDays = randInt(3, 21);
    const riskLevel: RiskLevel = score > 78 ? "low" : score > 58 ? "medium" : "high";
    const entryLow = parseFloat((price * 1.001).toFixed(2));
    const entryHigh = parseFloat((price * 1.018).toFixed(2));
    const stopLoss = parseFloat((price * (1 - rand(0.04, 0.09))).toFixed(2));
    const target1 = parseFloat((price * (1 + rand(0.08, 0.16))).toFixed(2));
    const target2 = parseFloat((price * (1 + rand(0.18, 0.35))).toFixed(2));
    const riskAmt = price - stopLoss;
    const rewardAmt = target1 - price;
    const riskReward = parseFloat((rewardAmt / riskAmt).toFixed(1));
    const rsRank: StockSignal["rsRank"] =
      rs >= 90 ? "top10" : rs >= 75 ? "top25" : rs >= 50 ? "top50" : "below";
    const priceHistory = generatePriceHistory(raw.price, setupType === "squeeze" ? "squeeze" : setupType === "accumulation" ? "flat" : "up");
    const volumeHistory = generateVolumeHistory(avgVol, unusualVolume);
    const watchlistPriority: "A" | "B" | "C" = score >= 80 ? "A" : score >= 62 ? "B" : "C";

    const partial: Partial<StockSignal> = {
      volumeRatio, emaAlignment, rsi, macdSignal, unusualVolume, isAccumulating,
      volatilitySqueezing, newsPositive, premarket, rs, distToBreakout,
    };

    return {
      ticker: raw.ticker,
      name: raw.name,
      sector: raw.sector,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      score: Math.round(score),
      rank: i + 1,
      volume: Math.floor(avgVol * volumeRatio),
      avgVolume: avgVol,
      volumeRatio: parseFloat(volumeRatio.toFixed(2)),
      rsi: parseFloat(rsi.toFixed(1)),
      macdSignal,
      emaAlignment,
      nearKeyLevel: distToBreakout < 4,
      distToBreakout: parseFloat(distToBreakout.toFixed(1)),
      consolidationDays,
      rs: Math.round(rs),
      rsRank,
      setupType,
      entryLow,
      entryHigh,
      stopLoss,
      target1,
      target2,
      riskReward,
      riskLevel,
      unusualVolume,
      isAccumulating,
      volatilitySqueezing,
      newsPositive,
      premarket,
      priceHistory,
      volumeHistory,
      confirmations: buildConfirmations(partial),
      watchlistPriority,
    } as StockSignal;
  }).sort((a, b) => b.score - a.score).map((s, i) => ({ ...s, rank: i + 1 }));
}

export function formatVolume(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

export function formatPrice(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ============================================================
// ScannerStock mock — the richer type consumed by Scanner.tsx.
// Generated from the base StockSignal data with fake news / catalyst /
// options overlays so the UI renders with realistic, deterministic data
// even when the backend is unreachable.
// ============================================================

import type {
  ScannerStock,
  CatalystType,
  OptionsSignal,
  OptionsDirection,
  OptionsConfidence,
} from "./types";

const CATALYSTS: CatalystType[] = [
  "earnings_beat",
  "analyst_upgrade",
  "new_product",
  "partnership",
  "fda_approval",
  "contract_win",
  "insider_buying",
  "buyback",
  "sector_rotation",
];

const HEADLINES: [string, "positive" | "negative" | "neutral"][] = [
  ["Analysts raise price target after strong quarter", "positive"],
  ["Institutional buying detected above key level", "positive"],
  ["Guidance reaffirmed; order backlog grows", "positive"],
  ["Volatility compresses ahead of product event", "neutral"],
  ["Short interest spikes on sector rotation chatter", "neutral"],
  ["Regulatory filing draws investor questions", "negative"],
];

function mockOptionsSignal(
  s: { score: number; change: number; price: number; setupType: string }
): OptionsSignal {
  const score = s.score;
  const direction: OptionsDirection =
    score >= 78 && s.change >= 0 ? "call" : score <= 45 ? "put" : score >= 62 ? "call" : "no_trade";
  const confidence: OptionsConfidence =
    score >= 85 ? "high" : score >= 68 ? "medium" : "low";
  const strikeOffset = direction === "call" ? 1.04 : direction === "put" ? 0.96 : 1.0;
  return {
    direction,
    confidence,
    confidenceScore: Math.round(score),
    rationale:
      direction === "no_trade"
        ? []
        : [
            `${s.setupType} pattern in progress with supportive volume`,
            "Trend filter aligned on daily timeframe",
            confidence === "high" ? "Multiple confirmations stacking" : "Partial confirmations",
          ],
    warnings: confidence === "low" ? ["Conflicting short-term signals — reduce size"] : [],
    recommendedStrike:
      direction === "no_trade" ? null : Math.round(s.price * strikeOffset),
    recommendedExpiry: direction === "no_trade" ? null : "~10 days",
    expiryDays: direction === "no_trade" ? null : 10,
    targetMove: direction === "call" ? 6 : direction === "put" ? -6 : null,
    maxLoss: "Premium paid",
    entryTiming: "After first 15 min of regular session, on confirmation",
    exitTiming: "Scale at 1R; invalidate below pattern level",
    deltaTarget: "~0.40",
    ivGuidance: "IV rank under 60 preferred",
  };
}

export function generateMockScannerStocks(): ScannerStock[] {
  const base = generateScannerData();
  return base.map((s, i) => {
    const catalysts: CatalystType[] = [];
    if (s.newsPositive) catalysts.push("earnings_beat");
    if (i % 3 === 0) catalysts.push("analyst_upgrade");
    if (i % 5 === 0) catalysts.push("insider_buying");
    const hl = HEADLINES[i % HEADLINES.length];
    return {
      ...s,
      lastUpdated: new Date().toISOString(),
      sentimentScore: Math.round((s.score - 50) / 2),
      sentimentLabel: s.score >= 70 ? "bullish" : s.score >= 50 ? "neutral" : "bearish",
      newsVolume: s.newsPositive ? 12 : 4,
      newsVolumeLabel: s.newsPositive ? "high" : "normal",
      catalysts,
      topHeadline: hl[0],
      topHeadlineSentiment: hl[1],
      analystSignal:
        i % 4 === 0
          ? { type: "upgrade", detail: "Price target raised", date: "2d ago" }
          : null,
      earningsSignal:
        i % 6 === 0
          ? { type: "beat", detail: "Beat EPS + revenue", date: "7d ago" }
          : null,
      socialBuzz: Math.round(40 + (s.score - 50) * 0.8),
      newsArticles: [],
      optionsSignal: mockOptionsSignal({
        score: s.score,
        change: s.change,
        price: s.price,
        setupType: s.setupType,
      }),
    } as ScannerStock;
  });
}

// Simple mock watchlist for offline render
export interface WatchlistStock extends ScannerStock {
  id: string;
  priority: "A" | "B" | "C";
  addedAt: string;
}

export function generateMockWatchlist(): WatchlistStock[] {
  return generateMockScannerStocks().slice(0, 6).map((s, i) => ({
    ...s,
    id: `wl-${i}`,
    priority: s.watchlistPriority,
    addedAt: new Date(Date.now() - i * 86400_000).toISOString(),
  }));
}
