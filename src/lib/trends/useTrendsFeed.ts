"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSymbols } from "@/lib/symbolsStore";
import { pushTrendHistory } from "@/lib/useTrendHistory";
import { getFiat } from "@/lib/fiatStore";

export type TrendItem = {
  symbol: string;
  trend: "up" | "down" | "flat";
  score: number;
  reason: string;
  ts?: string;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
};

type RawTrendApiItem = {
  symbol?: string;
  trend?: "up" | "down" | "flat";
  score?: number;
  reason?: string;
  ts?: string;
  item?: {
    symbol?: string;
    data?: {
      price_change_percentage_24h?: Record<string, number>;
      market_cap?: string;
      total_volume?: string;
    };
  };
};

type TrendsResponse = {
  ts?: string;
  updatedAt?: string;
  data?: RawTrendApiItem[];
  items?: RawTrendApiItem[];
};

export type TrendsHealth = {
  ok: boolean;
  lastOkAt?: string;
  lastErr?: string;
};

export type MarketStats = {
  total: number;
  up: number;
  down: number;
  flat: number;
  breadthUpPct: number;
  breadthDownPct: number;
  mood: "BULLISH" | "BEARISH" | "NEUTRAL";
  avgScore: number;
  confidence: number;
  volatility: "LOW" | "MED" | "HIGH";
  topSymbol?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

  function parseMoneyString(value?: string): number | undefined {
    if (!value) return undefined;
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined; 
  }

  function pick24hByFiat(
    map?: Record<string, number>,
    fiat?: string
  ): number | undefined {
    if (!map) return undefined;
    const key = (fiat || "usd").toLowerCase();
    return map[key] ?? map.usd; 
  }

async function fetchTrends(symbols: string[]) {
  const qs = encodeURIComponent(symbols.join(","));
  const res = await fetch(`/api/social/trends?symbols=${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`social_link HTTP ${res.status}`);
  return (await res.json()) as TrendsResponse;
}

function computeMarketStats(items: TrendItem[]): MarketStats {
  const total = items.length;
  const up = items.filter((t) => t.trend === "up").length;
  const down = items.filter((t) => t.trend === "down").length;
  const flat = items.filter((t) => t.trend === "flat").length;

  const breadthUpPct = total ? Math.round((up / total) * 100) : 0;
  const breadthDownPct = total ? Math.round((down / total) * 100) : 0;

  const mood: MarketStats["mood"] =
    up > down ? "BULLISH" : down > up ? "BEARISH" : "NEUTRAL";

  const scores = items.map((t) => (typeof t.score === "number" ? t.score : 0));
  const avgScore = total ? scores.reduce((a, b) => a + b, 0) / total : 0;

  const consensus = total ? Math.abs(up - down) / total : 0;
  const SCORE_CAP = 5;
  const scoreAbs = Math.abs(avgScore);
  const scoreNorm = clamp(scoreAbs / SCORE_CAP, 0, 1);
  const confidence = Math.round(clamp(scoreNorm * 60 + consensus * 40, 0, 100));

  const mix = 1 - consensus;
  const flatPct = total ? flat / total : 0;

  let volatility: MarketStats["volatility"];
  if (flatPct > 0.75) volatility = "LOW";
  else volatility = mix > 0.66 ? "HIGH" : mix > 0.33 ? "MED" : "LOW";

  const top = [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.symbol;

  return {
    total,
    up,
    down,
    flat,
    breadthUpPct,
    breadthDownPct,
    mood,
    avgScore: Number.isFinite(avgScore) ? avgScore : 0,
    confidence,
    volatility,
    topSymbol: top,
  };
}

export function useTrendsFeed({
  onHealth,
  onItems,
}: {
  onHealth?: (h: TrendsHealth) => void;
  onItems?: (items: TrendItem[]) => void;
}) {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [ts, setTs] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [chipCount, setChipCount] = useState(0);
  const [auto, setAuto] = useState(true);
  const [filter, setFilter] = useState<"all" | "up" | "down">("all");
  const [hist, setHist] = useState<Record<string, number[]>>({});
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const reqSeq = useRef(0);

  const loadSymbols = useCallback(() => {
    const s = getSymbols();
    setSymbols(s);
    setChipCount(s.length);
  }, []);

  const load = useCallback(
    async (kind: "initial" | "refresh" = "refresh") => {
      const seq = ++reqSeq.current;

      try {
        setError(null);
        if (kind === "initial") setLoading(true);
        else setRefreshing(true);

      const list = getSymbols();
      if (!list.length) return;

      const r = await fetchTrends(list);
      if (seq !== reqSeq.current) return;

      const resolvedTs = r.updatedAt ?? r.ts ?? new Date().toISOString();
      const raw: RawTrendApiItem[] = r.items ?? r.data ?? [];
      const fiat = String(getFiat() || "USD").toLowerCase();

      const nextItems = raw
        .map((t): TrendItem | null => {
          const score = typeof t.score === "number" ? t.score : 0;

          const trend: TrendItem["trend"] =
            t.trend === "up" || t.trend === "down" || t.trend === "flat"
              ? t.trend
              : score > 0.15
              ? "up"
              : score < -0.15
              ? "down"
              : "flat";

          const symbol =
            t.symbol?.toUpperCase() ??
            t.item?.symbol?.toUpperCase() ??
            "";

          if (!symbol) return null;

          return {
            symbol,
            trend,
            score,
            reason: t.reason ?? "",
            ts: t.ts ?? resolvedTs,
            change24h: pick24hByFiat(
              t.item?.data?.price_change_percentage_24h,
              fiat
            ),
            marketCap: parseMoneyString(t.item?.data?.market_cap),
            volume24h: parseMoneyString(t.item?.data?.total_volume),
          };
        })
        .filter((x): x is TrendItem => x !== null)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      for (const it of nextItems) {
        if (typeof it.score === "number") {
          pushTrendHistory(it.symbol, it.score, 120);
        }
      }

      setTs(resolvedTs);
      setItems(nextItems);
      setLastUpdated(resolvedTs);

      setHist((prev) => {
        const next = { ...prev };
        for (const it of nextItems) {
          const arr = next[it.symbol] ? [...next[it.symbol]] : [];
          arr.push(it.score ?? 0);
          if (arr.length > 24) arr.splice(0, arr.length - 24);
          next[it.symbol] = arr;
        }
        return next;
      });

      queueMicrotask(() => {
        if (seq !== reqSeq.current) return;
        onItems?.(nextItems);
        onHealth?.({ ok: true, lastOkAt: resolvedTs });
      });
    } catch (e: any) {
      if (seq !== reqSeq.current) return;
      const msg = e?.message ?? "Error cargando trends";
      setError(msg);

      queueMicrotask(() => {
        if (seq !== reqSeq.current) return;
        onHealth?.({ ok: false, lastErr: msg });
      });
    } finally {
      if (seq !== reqSeq.current) return;
      setLoading(false);
      setRefreshing(false);
      }
    },
    [onHealth, onItems]
  );

  useEffect(() => {
    loadSymbols();
    window.addEventListener("cryptolink:symbols", loadSymbols as any);
    return () => window.removeEventListener("cryptolink:symbols", loadSymbols as any);
  }, [loadSymbols]);

  useEffect(() => {
    const savedFilter = window.localStorage.getItem("cl_trends_filter") as any;
    if (savedFilter === "all" || savedFilter === "up" || savedFilter === "down") {
      setFilter(savedFilter);
    }

    const savedAuto = window.localStorage.getItem("cl_trends_auto");
    if (savedAuto === "0" || savedAuto === "1") {
      setAuto(savedAuto === "1");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("cl_trends_filter", filter);
  }, [filter]);

  useEffect(() => {
    window.localStorage.setItem("cl_trends_auto", auto ? "1" : "0");
  }, [auto]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let failCount = 0;

    const ACTIVE_MS = 15_000;
    const IDLE_MS = 60_000;
    const MAX_BACKOFF_MS = 120_000;

    const nextDelay = () => {
      const base = document.visibilityState === "visible" ? ACTIVE_MS : IDLE_MS;
      return Math.min(base * (1 + failCount), MAX_BACKOFF_MS);
    };

    const schedule = (delay: number) => {
      if (stopped) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (stopped || !auto) return;

      try {
        await load("refresh");
        failCount = 0;
      } catch {
        failCount++;
      }

      schedule(nextDelay());
    };

    load("initial");
    if (auto) schedule(0);

    const onSymbols = () => schedule(0);
    const onVis = () => schedule(nextDelay());

    window.addEventListener("cryptolink:symbols", onSymbols as any);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("cryptolink:symbols", onSymbols as any);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [auto, load, symbols.length]);

  const stats = useMemo(() => computeMarketStats(items), [items]);

  const viewItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((t) => t.trend === filter);
  }, [items, filter]);

  return {
    items,
    ts,
    error,
    loading,
    refreshing,
    symbols,
    chipCount,
    auto,
    setAuto,
    filter,
    setFilter,
    hist,
    lastUpdated,
    stats,
    viewItems,
    reload: () => load("refresh"),
  };
}