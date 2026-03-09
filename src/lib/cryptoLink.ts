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