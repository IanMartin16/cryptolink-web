"use client";

import { useState, useEffect, useMemo } from "react";
import PricesPanel from "@/components/PricesPanel";
import StatCards from "@/components/StatCards";
import TrendsTable from "@/components/TrendsTable";
import StatusBar from "@/components/StatusBar";
import { UI } from "@/lib/ui";
import type { Health } from "@/lib/health";
import { HEALTH_OK } from "@/lib/health";
import TopHeader, { Chip } from "@/components/TopHeader";
import MarketMood from "@/components/MarketMood";
import { buildMarketInsight } from "@/lib/insights";
import { computeMood } from "@/lib/moodEngine";
import { normalizeTrends } from "@/lib/trendEngine";
import type { PriceRow, TrendItem } from "@/lib/types";
import type { SnapshotKPIs } from "@/lib/types";
import { computeSnapshotKPIs } from "@/lib/snapshotEngine";
import MarketSnapshotBar from "@/components/MarketSnapshotBar";
import MarketSparkStrip from "@/components/MarketSparkStrip";
import SocialPulseBoard from "@/components/SocialPulseBoard";
import InsightCard from "@/components/InsightCard";
import { buildInsightV2 } from "@/lib/insight/buildInsightV2";
import { usePricesFeed } from "@/lib/hooks/usePricesFeed";
import { useTrendsFeed } from "@/lib/trends/useTrendsFeed";


export default function DashboardPage() {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [pricesHealth, setPricesHealth] = useState<Health>(HEALTH_OK);

  const [trendsHealth, setTrendsHealth] = useState<Health>(HEALTH_OK);
  const [trendItems, setTrendItems] = useState<TrendItem[]>([]);

  const [moodUpdatedAt, setMoodUpdatedAt] = useState<string>("—");

  // ✅ 1) Normaliza trends UNA vez
  const normalizedTrends = useMemo(() => normalizeTrends(trendItems), [trendItems]);

  // ✅ 2) Mood UNA vez (source of truth)
  const mood = useMemo(() => computeMood(rows, normalizedTrends), [rows, normalizedTrends]);

  // ✅ 3) Insight “market sentiment”
  const moodInsight = useMemo(
    () =>
      buildMarketInsight({
        rows,
        moodScore: mood.score,
        trends: normalizedTrends,
      }),
    [rows, mood.score, normalizedTrends]
  );

  useEffect(() => {
  const sample = rows.slice(0, 6).map(r => ({
    sym: r.symbol,
    price: r.price,
    prev: r.prevPrice,
    pct: r.pct,
  }));
  console.log("[dash rows sample]", sample);
}, [rows]);

  // ✅ 4) Snapshot KPIs (MarketSnapshotBar)
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

  // ✅ 5) Insight narrativo V2
  

  // ✅ “last updated” del mood
  useEffect(() => {
    setMoodUpdatedAt(new Date().toLocaleTimeString());
  }, [mood.score, mood.confidence, normalizedTrends.length]);


const insight = buildInsightV2({
  mood,
  snapshot,
  rows,
  trends: normalizedTrends, 
});

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
  <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6">
    <TopHeader
      title={
        <>
          CryptoLink <span style={{ color: UI.orange }}>V2.5</span>
        </>
      }
      subtitle={"Dashboard · batch pricing · social movers · SSE"}
      right={
        <>
          <Chip>LIVE</Chip>
          <Chip>refresh: 10s</Chip>
          <Chip>batch BFF</Chip>
        </>
      }
    />

    <div className="mt-3">
      <StatusBar prices={pricesHealth} trends={trendsHealth} />
    </div>
    <SocialPulseBoard />

      <MarketSnapshotBar snapshot={snapshot} />

      <InsightCard
        headline={insight.headline}
        summary={insight.summary}
        note={insight.note}
        moodScore={mood.score}
      />

      <div className="mt-1">
        <StatCards rows={rows} />
      </div>

      <MarketSparkStrip rows={rows} max={12} />

      {/* 👇 Este era el que rompía iPhone: 2 cols fijo.
          Ahora: 1 col en mobile, 2 cols en md+ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        {/* Si PricesPanel es alto, en mobile queda arriba y Trends abajo */}
        
    </div>
  </div>
);
}