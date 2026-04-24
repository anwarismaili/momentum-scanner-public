// Shared types — mirrors server/scanner.ts ScannerStock

export type SetupType = "breakout" | "accumulation" | "momentum" | "reversal" | "squeeze";
export type RiskLevel = "low" | "medium" | "high";
export type RSRank = "top10" | "top25" | "top50" | "below";
export type CatalystType =
  | "earnings_beat" | "earnings_miss"
  | "analyst_upgrade" | "analyst_downgrade"
  | "new_product" | "partnership"
  | "fda_approval" | "contract_win"
  | "insider_buying" | "buyback"
  | "regulatory" | "management_change"
  | "sector_rotation";

export interface ScannerStock {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  score: number;
  rank: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  rsi: number;
  macdSignal: "bull" | "neutral" | "bear";
  emaAlignment: boolean;
  nearKeyLevel: boolean;
  distToBreakout: number;
  consolidationDays: number;
  rs: number;
  rsRank: RSRank;
  setupType: SetupType;
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: number;
  riskLevel: RiskLevel;
  unusualVolume: boolean;
  isAccumulating: boolean;
  volatilitySqueezing: boolean;
  newsPositive: boolean;
  premarket: boolean;
  priceHistory: number[];
  volumeHistory: number[];
  confirmations: string[];
  watchlistPriority: "A" | "B" | "C";
  lastUpdated: string;
  // News & Sentiment
  sentimentScore: number;
  sentimentLabel: "bullish" | "bearish" | "neutral";
  newsVolume: number;
  newsVolumeLabel: "high" | "normal" | "low";
  catalysts: CatalystType[];
  topHeadline: string | null;
  topHeadlineSentiment: "positive" | "negative" | "neutral" | null;
  analystSignal: { type: string; detail: string; date: string } | null;
  earningsSignal: { type: string; detail: string; date: string } | null;
  socialBuzz: number;
  newsArticles: {
    title: string;
    publishedAt: string;
    publisher: string;
    url: string;
    sentiment: string;
    catalystType: string | null;
  }[];
  optionsSignal: OptionsSignal;
}

export const CATALYST_LABELS: Record<string, string> = {
  earnings_beat: "Earnings Beat",
  earnings_miss: "Earnings Miss",
  analyst_upgrade: "Analyst Upgrade",
  analyst_downgrade: "Analyst Downgrade",
  new_product: "New Product",
  partnership: "Partnership",
  fda_approval: "FDA Approval",
  contract_win: "Contract Win",
  insider_buying: "Insider Buying",
  buyback: "Buyback",
  regulatory: "Regulatory",
  management_change: "Mgmt Change",
  sector_rotation: "Sector Rotation",
};

export const CATALYST_COLORS: Record<string, string> = {
  earnings_beat: "badge-bull",
  analyst_upgrade: "badge-bull",
  fda_approval: "badge-bull",
  contract_win: "badge-bull",
  partnership: "badge-bull",
  insider_buying: "badge-bull",
  buyback: "badge-watch",
  new_product: "badge-watch",
  sector_rotation: "badge-neutral",
  management_change: "badge-neutral",
  earnings_miss: "badge-bear",
  analyst_downgrade: "badge-bear",
  regulatory: "badge-bear",
};

export type OptionsDirection = "call" | "put" | "no_trade";
export type OptionsConfidence = "high" | "medium" | "low";

export interface OptionsSignal {
  direction: OptionsDirection;
  confidence: OptionsConfidence;
  confidenceScore: number;
  rationale: string[];
  warnings: string[];
  recommendedStrike: number | null;
  recommendedExpiry: string | null;
  expiryDays: number | null;
  targetMove: number | null;
  maxLoss: string;
  entryTiming: string;
  exitTiming: string;
  deltaTarget: string;
  ivGuidance: string;
}

// Watchlist entity — mirrors the backend's watchlist row.
// Carries all ScannerStock fields plus DB-level id/priority/addedAt.
export interface WatchlistStock extends ScannerStock {
  id: string;
  priority: "A" | "B" | "C";
  addedAt: string;
}
