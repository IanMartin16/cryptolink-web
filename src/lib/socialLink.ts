export type TrendItem = {
  symbol: string;
  trend: "up" | "down" | "flat";
  score: number;
  reason: string;
};

export type TrendsResponse = {
  ts: string;
  data: TrendItem[];
};

export async function fetchTrends(symbols: string[]): Promise<TrendsResponse> {
  const qs = encodeURIComponent(symbols.join(","));
  const url = `/api/social/trends?symbols=${qs}&fiat=MXN`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CryptoLink trends HTTP ${res.status}`);

  const raw = await res.json();

  return {
    ts: raw.updatedAt ?? raw.ts ?? new Date().toISOString(),
    data: Array.isArray(raw.items)
      ? raw.items.map((t: any) => ({
          symbol: String(t.symbol ?? ""),
          trend: String(t.trend ?? "FLAT").toLowerCase() as "up" | "down" | "flat",
          score: Number(t.score ?? 0),
          reason:
            t.trend === "UP"
              ? `Momentum positivo (${Number(t.changePct ?? 0).toFixed(2)}%)`
              : t.trend === "DOWN"
              ? `Momentum negativo (${Number(t.changePct ?? 0).toFixed(2)}%)`
              : `Movimiento estable (${Number(t.changePct ?? 0).toFixed(2)}%)`,
        }))
      : [],
  };
}