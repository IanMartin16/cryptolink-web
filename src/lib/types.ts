export type PriceRow = {
  updatedAt?: string | undefined;
  symbol: string;
  fiat?: string;
  price?: number;
  prevPrice?: number;
  pct?: number;         // si ya lo calculas en UI, opcional
  ok?: boolean;
  cache?: string;
  ts?: string;
  source?: string;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
};

export type TrendItem = {
  symbol: string;
  trend: "up" | "down" | "flat";
  score: number;
  reason?: string;
  ts?: string;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
};

export type MoodInsight = {
  line1: string;
  line2: string;
  divergence?: boolean;
};

export type MoodResult = {
  score: number;          // -100..100
  confidence: number;     // 0..1
};

export type BadgeTone = "good" | "warn" | "bad" | "neutral";

export type SnapshotKPIKey = "upDown" | "divergence" | "confidence" | "pressure";

export type SnapshotKPI = {
  key: SnapshotKPIKey;
  label: string;
  value: string;        // lo que se imprime (ej: "62% / 38%", "High", "+18")
  sub?: string;         // opcional (ej: "12 assets", "vs last tick")
  tone: BadgeTone;      // para color/estilo consistente
  raw?: number;         // número para ordenar/debug si lo necesitas
};

export type SnapshotKPIs = {
  updatedAt: number;    // Date.now()
  items: SnapshotKPI[]; // los 4 KPIs en orden
};

// en lib/types.ts
export type TrendsSummary = {
  up: number;
  down: number;
  flat: number;
  avgScore: number;
  topSymbols: string[];
};

export type TrendingCoin = {
  id: string;
  symbol: string;
  name: string;
  rank: number | null;       // market_cap_rank — contexto: rank 2000 != rank 2
  image: string | null;
  price: number | null;
  change24h: number | null;
  sparkline: string | null;  // URL del SVG que CoinGecko ya provee
  marketCap: string | null;  // viene preformateado: "$42,537,178,536"
  volume24h: string | null;
  description: string | null;
};