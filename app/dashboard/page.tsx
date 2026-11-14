"use client";

import { useState, useEffect, useMemo } from "react";
import StatCards from "@/components/StatCards";
import StatusBar from "@/components/StatusBar";
import { UI } from "@/lib/ui";
import type { Health } from "@/lib/health";
import { HEALTH_OK } from "@/lib/health";
import TopHeader, { Chip } from "@/components/TopHeader";
import { computeMood } from "@/lib/moodEngine";
import type { PriceRow, TrendItem } from "@/lib/types";
import type { SnapshotKPIs } from "@/lib/types";
import MarketSnapshotBar from "@/components/MarketSnapshotBar";
import { useMarketSnapshot } from "@/lib/hooks/useMarketSnapshot";
import { usePricesFeed } from "@/lib/hooks/usePricesFeed";
import { useTrendsFeed } from "@/lib/trends/useTrendsFeed";
import TrendingNow from "@/components/TrendingNow";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import MarketOverviewTable from "@/components/MarketOverviewTable";


export default function DashboardPage() {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [pricesHealth, setPricesHealth] = useState<Health>(HEALTH_OK);

  const [trendsHealth, setTrendsHealth] = useState<Health>(HEALTH_OK);
  const [trendItems, setTrendItems] = useState<TrendItem[]>([]);

  const [moodUpdatedAt, setMoodUpdatedAt] = useState<string>("—");

  useEffect(() => {
    const sample = rows.slice(0, 6).map(r => ({
      sym: r.symbol,
      price: r.price,
      prev: r.prevPrice,
      pct: r.pct,
    }));
  }, [rows]);

  const { snapshot, status } = useMarketSnapshot();

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
    <TopHeader
      title={
        <>
          CryptoLink 
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

    <MarketSnapshotBar snapshot={snapshot} status={status} />

      <div className="mt-1">
        <StatCards  />
      </div>
      <TrendingNow/>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1 md:items-start">
      <MarketOverviewTable /> 
    </div>
  </div>
);
}