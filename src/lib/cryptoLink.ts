export type PriceItem = {
  symbol: string;
  price: number;
  change24h: number;
};

export type PriceResponse = {
  ts?: string;
  data: PriceItem[];
};

function baseUrl() {
  return process.env.NEXT_PUBLIC_CRYPTOLINK_API_BASE || "http://localhost:8080";
}

export async function fetchPrice(symbol: string, fiat: string, apiKey: string) {
  const url = `/api/cryptolink/price?symbol=${encodeURIComponent(symbol)}&fiat=${encodeURIComponent(fiat)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { "x-api-key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} - ${text}`);
  }

  return res.json();
}

export type BatchItem = { symbol: string; ok: boolean; data: any; cache: "HIT" | "MISS" };
export type PricesBatchResponse = { ok: boolean; ts: string; fiat: string; data: BatchItem[] };

export async function fetchPricesBatch(symbols: string[], fiat: string, apiKey: string): Promise<PricesBatchResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const url = `/api/cryptolink/prices?symbols=${qs}&fiat=${encodeURIComponent(fiat)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { "x-api-key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} - ${text}`);
  }

  return res.json();
}

export type MomentumItem = {
  symbol: string;
  direction: "up" | "down" | "flat";
  changePct: number;
  strength: "low" | "medium" | "high";
  score: number;
  last: number | null;
  source: string;
};

export type MomentumResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  momentum: MomentumItem[];
};

export async function fetchMomentum(symbols: string[]): Promise<MomentumResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(`/api/social/momentum?symbols=${qs}&fiat=MXN`, { cache: "no-store" });
  if (!res.ok) throw new Error(`CryptoLink momentum HTTP ${res.status}`);
  return (await res.json()) as MomentumResponse;
}

export type RegimeResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  regime: {
    state: "bullish" | "bearish" | "neutral" | "mixed";
    score: number;
    confidence: number;
    summary: string;
  };
};

export async function fetchRegime(symbols: string[]): Promise<RegimeResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(`/api/social/regime?symbols=${qs}&fiat=MXN`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CryptoLink regime HTTP ${res.status}`);
  return (await res.json()) as RegimeResponse;
}

export type SignalPoint = {
  label: string;
  value: number;
};

export type SignalsResponse = {
  ok: boolean;
  ts: string;
  fiat: string;
  signals: SignalPoint[];
};

export async function fetchSignals(symbols: string[]): Promise<SignalsResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(`/api/social/signals?symbols=${qs}&fiat=MXN`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Signals HTTP ${res.status}`);
  return (await res.json()) as SignalsResponse;
}

export type MarketHealthResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  marketHealth: {
    state: "healthy" | "stable" | "fragile" | "under_pressure";
    score: number;
    summary: string;
  };
};

export async function fetchMarketHealth(symbols: string[]): Promise<MarketHealthResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(`/api/social/market-health?symbols=${qs}&fiat=MXN`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Market Health HTTP ${res.status}`);
  return (await res.json()) as MarketHealthResponse;
}

export type SocialPulseResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  socialPulse: {
    state: "bullish" | "bearish" | "mixed" | "neutral";
    score: number;
    breadth: "broad" | "selective" | "low";
    conviction: "strong" | "moderate" | "low";
    leadership: "concentrated" | "distributed" | "mixed";
    summary: string;
    topAssets: string[];
    tags: string[];
  };
};

export async function fetchSocialPulse(symbols: string[]): Promise<SocialPulseResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(`/api/social/social-pulse?symbols=${qs}&fiat=MXN`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Social Pulse HTTP ${res.status}`);
  return (await res.json()) as SocialPulseResponse;
}

// ---------- ANOMALIES ----------
export type AnomalyItem = {
  symbol: string;
  type: string;        // ej. "momentum_spike"
  severity: "low" | "medium" | "high" | string;
  score: number;
  detail: string;
};

export type AnomaliesResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  summary: string;
  anomalies: AnomalyItem[];
};

export async function fetchAnomalies(
  symbols: string[],
  fiat: string = "USD"
): Promise<AnomaliesResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(
    `/api/social/anomalies?symbols=${qs}&fiat=${encodeURIComponent(fiat)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Anomalies HTTP ${res.status}`);
  return (await res.json()) as AnomaliesResponse;
}

// ---------- RISK FLAGS ----------
export type RiskFlag = {
  code: string;         // ej. "weak_momentum"
  severity: "low" | "medium" | "high" | string;
  title: string;
  detail: string;
};

export type RiskFlagsResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  summary: string;
  flags: RiskFlag[];
};

export async function fetchRiskFlags(
  symbols: string[],
  fiat: string = "USD"
): Promise<RiskFlagsResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(
    `/api/social/risk-flags?symbols=${qs}&fiat=${encodeURIComponent(fiat)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Risk flags HTTP ${res.status}`);
  return (await res.json()) as RiskFlagsResponse;
}

// ---------- SNAPSHOT (mood + summary del héroe) ----------
export type SnapshotResponse = {
  ok: boolean;
  snapshot: {
    prices: Record<string, number>;
    fiat: string;
    provider: string;
    marketMood: "bullish" | "bearish" | "neutral" | "mixed" | string;
    source: string;
    asOf: string;
    // Campos opcionales para Fase futura: si el back los puebla,
    // el panel los puede consumir sin cambios estructurales.
    summary?: string;
  };
};

export async function fetchSnapshot(
  symbols: string[],
  fiat: string = "USD"
): Promise<SnapshotResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(
    `/api/social/snapshot?symbols=${qs}&fiat=${encodeURIComponent(fiat)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Snapshot HTTP ${res.status}`);
  return (await res.json()) as SnapshotResponse;
}

export type SymbolMarket = {
  symbol: string;
  name?: string | null;
  image?: string | null;
  rank?: number | null;
  price?: number | null;
  change24h?: number | null;
  high24h?: number | null;
  low24h?: number | null;
  marketCap?: number | null;
  volume24h?: number | null;
  circulatingSupply?: number | null;
  totalSupply?: number | null;
  maxSupply?: number | null;
  ath?: number | null;
  athChangePct?: number | null;
  athDate?: string | null;
};

export type SymbolsResponse = {
  ok: boolean;
  source: string;
  ts: string;
  fiat: string;
  symbols: SymbolMarket[];
  missing: string[];
};

export async function fetchSymbols360(
  symbols: string[],
  fiat: string = "USD"
): Promise<SymbolsResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(
    `/api/social/symbols?symbols=${qs}&fiat=${encodeURIComponent(fiat)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Symbols 360 HTTP ${res.status}`);
  return (await res.json()) as SymbolsResponse;
}