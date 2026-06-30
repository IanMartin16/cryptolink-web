"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BasicSignalsResponse, SocialAttentionItem } from "@/lib/social/fetchBasicSignals";
import { pushTrendHistory } from "@/lib/useTrendHistory";

/**
 * IMPORTANTE: Market Attention consume SOLO el remoto real de social_link.
 * NO usa fetchBasicSignals porque su fallback local (coingecko-trending-adapter)
 * FABRICA datos (attentionScore derivado de rank, attentionLosers inventados).
 * Para una tabla de datos estructurados que el usuario lee como reales, mostrar
 * datos fabricados durante una caída de Railway violaría el principio de no
 * pintar lo que el backend no sustenta. Si el remoto falla -> degradación con
 * gracia ("attention data unavailable"), como Market 360°.
 */
async function fetchMarketAttentionRemote(): Promise<BasicSignalsResponse> {
  const base = process.env.NEXT_PUBLIC_SOCIAL_LINK_BASE_URL;
  if (!base) {
    throw new Error("SOCIAL_LINK_BASE_URL not configured");
  }
  const res = await fetch(`${base}/internal/v1/basic-signals?window=1h&limit=10`, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`basic-signals HTTP ${res.status}`);
  }
  return (await res.json()) as BasicSignalsResponse;
}

/**
 * useMarketAttention — alimenta la tabla "Market Attention".
 *
 * Fuente: basic-signals de social_link (attentionLeaders + backdrop/fearGreed).
 * Reemplaza al antiguo trends de crypto (PriceHistoryCache efímero, datos pobres
 * que se perdían en cada redeploy).
 *
 * NOTA HONESTA: basic-signals devuelve un TOP FIJO (FALLBACK_ASSETS del back),
 * NO respeta selección de símbolos. Por eso esta tabla NO se suscribe a
 * cryptolink:symbols ni filtra por selección — es un "top de atención del
 * mercado", no "tus activos". El título lo refleja.
 */

export type AttentionRow = {
  symbol: string;
  attentionScore: number;        // 0..100 aprox (de social_link)
  attentionDeltaPct: number;     // cambio de atención
  direction: "up" | "down" | "flat";
  tags: string[];                // "majors-led", "store-of-value"... (el "reason" real)
};

export type FearGreed = {
  value: number;                 // 0..100
  label: string;                 // "Extreme Fear", "Greed"...
} | null;

export type AttentionStats = {
  total: number;
  up: number;
  down: number;
  flat: number;
  mood: "BULLISH" | "BEARISH" | "NEUTRAL";
  coverage: string;              // "low" | "moderate" | "high"
  topSymbol?: string;
};

export type AttentionHealth = {
  ok: boolean;
  lastOkAt?: string;
  lastErr?: string;
};

function normDirection(d?: string, delta?: number): AttentionRow["direction"] {
  const v = String(d ?? "").toLowerCase();
  if (v === "up" || v === "down" || v === "flat") return v as AttentionRow["direction"];
  // fallback por el delta si direction no viene claro
  if (typeof delta === "number") {
    if (delta > 0) return "up";
    if (delta < 0) return "down";
  }
  return "flat";
}

function computeStats(rows: AttentionRow[], coverage: string): AttentionStats {
  const total = rows.length;
  const up = rows.filter((r) => r.direction === "up").length;
  const down = rows.filter((r) => r.direction === "down").length;
  const flat = rows.filter((r) => r.direction === "flat").length;
  const mood: AttentionStats["mood"] =
    up > down ? "BULLISH" : down > up ? "BEARISH" : "NEUTRAL";
  const topSymbol = [...rows].sort((a, b) => b.attentionScore - a.attentionScore)[0]?.symbol;
  return { total, up, down, flat, mood, coverage, topSymbol };
}

export function useMarketAttention({
  onHealth,
  onItems,
}: {
  onHealth?: (h: AttentionHealth) => void;
  onItems?: (rows: AttentionRow[]) => void;
} = {}) {
  const [rows, setRows] = useState<AttentionRow[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreed>(null);
  const [coverage, setCoverage] = useState<string>("low");
  const [ts, setTs] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auto, setAuto] = useState(true);
  const [filter, setFilter] = useState<"all" | "up" | "down">("all");

  const reqSeq = useRef(0);

  const load = useCallback(
    async (kind: "initial" | "refresh" = "refresh") => {
      const seq = ++reqSeq.current;
      try {
        setError(null);
        if (kind === "initial") setLoading(true);
        else setRefreshing(true);

        const res: BasicSignalsResponse = await fetchMarketAttentionRemote();
        if (seq !== reqSeq.current) return;

        // el payload rico vive en res.market (attentionLeaders) + res.backdrop
        const market = res.market ?? (res as any);
        const leaders: SocialAttentionItem[] = market?.attentionLeaders ?? [];

        const mapped: AttentionRow[] = leaders.map((l) => ({
          symbol: String(l.asset ?? "").toUpperCase(),
          attentionScore: typeof l.attentionScore === "number" ? l.attentionScore : 0,
          attentionDeltaPct: typeof l.attentionDeltaPct === "number" ? l.attentionDeltaPct : 0,
          direction: normDirection(l.direction, l.attentionDeltaPct),
          tags: Array.isArray(l.tags) ? l.tags : [],
        })).filter((r) => r.symbol);

        // historial de attentionScore para sparklines (reusa el store existente)
        for (const r of mapped) {
          pushTrendHistory(r.symbol, r.attentionScore, 120);
        }

        const bd = res.backdrop ?? null;
        const fg: FearGreed = bd
          ? { value: Number((bd as any).fearGreedValue ?? 0), label: String((bd as any).fearGreedLabel ?? "") }
          : null;

        const resolvedTs = (res as any).ts ?? new Date().toISOString();

        if (seq !== reqSeq.current) return;
        setRows(mapped);
        setFearGreed(fg);
        setCoverage(String(market?.coverage ?? "low"));
        setTs(resolvedTs);

        queueMicrotask(() => {
          if (seq !== reqSeq.current) return;
          onItems?.(mapped);
          onHealth?.({ ok: true, lastOkAt: resolvedTs });
        });
      } catch (e: any) {
        if (seq !== reqSeq.current) return;
        const msg = e?.message ?? "Error cargando market attention";
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

  // persistencia de filtro/auto (igual que antes)
  useEffect(() => {
    const savedFilter = window.localStorage.getItem("cl_attention_filter") as any;
    if (savedFilter === "all" || savedFilter === "up" || savedFilter === "down") {
      setFilter(savedFilter);
    }
    const savedAuto = window.localStorage.getItem("cl_attention_auto");
    if (savedAuto === "0" || savedAuto === "1") setAuto(savedAuto === "1");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("cl_attention_filter", filter);
  }, [filter]);
  useEffect(() => {
    window.localStorage.setItem("cl_attention_auto", auto ? "1" : "0");
  }, [auto]);

  // polling con backoff (basic-signals cambia lento; window 1h)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let failCount = 0;

    const ACTIVE_MS = 30_000;
    const IDLE_MS = 90_000;
    const MAX_BACKOFF_MS = 180_000;

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

    const onVis = () => schedule(nextDelay());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [auto, load]);

  const stats = useMemo(() => computeStats(rows, coverage), [rows, coverage]);

  const viewRows = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.direction === filter);
  }, [rows, filter]);

  return {
    rows,
    viewRows,
    fearGreed,
    coverage,
    ts,
    error,
    loading,
    refreshing,
    auto,
    setAuto,
    filter,
    setFilter,
    stats,
    reload: () => load("refresh"),
  };
}
