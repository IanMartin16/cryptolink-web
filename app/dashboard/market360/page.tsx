"use client";

import { useEffect, useMemo, useState } from "react";
import Market360Panel from "@/components/Market360Panel";
import type { Health } from "@/lib/health";
import { getSymbols, setSymbols } from "@/lib/symbolsStore";
import { normalizeTrends } from "@/lib/trendEngine";
import { computeSnapshotKPIs } from "@/lib/snapshotEngine";
import type { SnapshotKPIs } from "@/lib/types";
import type { PriceRow, TrendItem } from "@/lib/types";
import { computeMood } from "@/lib/moodEngine";
import { buildInsightV2 } from "@/lib/insight/buildInsightV2"
import StatusBar from "@/components/StatusBar";
import PageHeader from "@/components/PageHeader";
import { usePricesFeed } from "@/lib/hooks/usePricesFeed";
import { useTrendsFeed } from "@/lib/trends/useTrendsFeed";
import { HEALTH_OK } from "@/lib/health";

export default function Market360Page() {
  const [selected, setSelectedState] = useState<string[]>([]);
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [marketHealth] = useState<Health>(HEALTH_OK);
  const [trendItems, setTrendItems] = useState<TrendItem[]>([]);
  const [moodUpdatedAt, setMoodUpdatedAt] = useState<string>("—");
  const [trendsHealth, setTrendsHealth] = useState<Health>(HEALTH_OK);
  const [pricesHealth, setPricesHealth] = useState<Health>(HEALTH_OK);

  // Normaliza trends UNA vez
  const normalizedTrends = useMemo(() => normalizeTrends(trendItems), [trendItems]);

  // Mood UNA vez (source of truth)
  const mood = useMemo(() => computeMood(rows, normalizedTrends), [rows, normalizedTrends]);

  // PRIMERO snapshot (v2 lo necesita)
const snapshot: SnapshotKPIs = useMemo(
  () =>
    computeSnapshotKPIs({
      rows,
      trends: normalizedTrends,
      moodScore: mood.score,
      confidence: mood.confidence,
    }),
  [rows, normalizedTrends, mood.score, mood.confidence]
);

  // "last updated" del mood
  useEffect(() => {
    setMoodUpdatedAt(new Date().toLocaleTimeString());
  }, [mood.score, mood.confidence, normalizedTrends.length]);

  // carga inicial de la selección persistida
  useEffect(() => {
    setSelectedState(getSymbols());
  }, []);

  const toggle = (sym: string) => {
    setSelectedState((prev) => {
      const key = sym.toUpperCase();
      const has = prev.includes(key);
      const next = has ? prev.filter((x) => x !== key) : [...prev, key];
      const capped = next.slice(0, 20);
      setSymbols(capped);
      return capped;
    });
  };

  const pricesFeed = usePricesFeed({
    onRows: setRows,
    onHealth: setPricesHealth,
  });

  const trendsFeed = useTrendsFeed({
    onItems: setTrendItems,
    onHealth: setTrendsHealth,
  });

  useEffect(() => {
    if (pricesFeed.rows.length) {
      setRows(pricesFeed.rows);
    }
  }, [pricesFeed.rows]);

  useEffect(() => {
    if (trendsFeed.items.length) {
      setTrendItems(trendsFeed.items);
    }
  }, [trendsFeed.items]);

  return (
    <div>
      <PageHeader
        title="Market 360°"
        subtitle="Rich market data · interpretive signals · real-time view"
        health={marketHealth}
        badge="LIVE"
      />
      <StatusBar
        items={[
          {
            label: "Market 360°",
            ok: true,
            lastOkAt: pricesHealth?.lastOkAt,
          },
        ]}
        trailingLabel="market data · intelligence"
      />
      <div className="min-h-[320px] sm:min-h-[360px]">
        <Market360Panel />
      </div>
    </div>
  );
}
