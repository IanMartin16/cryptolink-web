"use client";

import { useEffect, useMemo, useState } from "react";
import PriceComparePanel from "@/components/PricesChartPanel";
import type { Health } from "@/lib/health";
import { getSymbols, setSymbols } from "@/lib/symbolsStore";
import PricesPanel from "@/components/PricesPanel";
import MarketMood from "@/components/MarketMood";
import { normalizeTrends } from "@/lib/trendEngine";
import { computeSnapshotKPIs } from "@/lib/snapshotEngine";
import type { SnapshotKPIs } from "@/lib/types";
import type { PriceRow, TrendItem } from "@/lib/types";
import { computeMood } from "@/lib/moodEngine";
import { buildMarketInsight } from "@/lib/insights";
import StatusBar from "@/components/StatusBar";
import PageHeader from "@/components/PageHeader";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import { usePricesFeed } from "@/lib/hooks/usePricesFeed";
import { useTrendsFeed } from "@/lib/trends/useTrendsFeed";
import { HEALTH_OK } from "@/lib/health";

export default function SymbolsPage() {
  const [selected, setSelectedState] = useState<string[]>([]);
  const storedMainSymbol = useMarketSignalsStore((s: { compareMainSymbol: string | null}) => s.compareMainSymbol);
  const [main, setMain] = useState("BTC");
  const [rows, setRows] = useState<PriceRow[]>([]);  
  const [health, setHealth] = useState<Health | undefined>(undefined);
  const [trendItems, setTrendItems] = useState<TrendItem[]>([]);
   const [moodUpdatedAt, setMoodUpdatedAt] = useState<string>("—");
    const [trendsHealth, setTrendsHealth] = useState<Health>(HEALTH_OK);
    const [pricesHealth, setPricesHealth] = useState<Health>(HEALTH_OK);
  
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

  useEffect(() => {
    if (storedMainSymbol && storedMainSymbol !== main) {
      setMain(storedMainSymbol);
    }
  }, [storedMainSymbol, main]);


  // feed para el chart (reusamos tu PricesPanel para no duplicar fetch todavía)

  useEffect(() => {
    const s = getSymbols();
    setSelectedState(s);
    if (s[0]) setMain(s[0]);
  }, []);

  // si main ya no está seleccionado, cae al primero
  useEffect(() => {
    if (!selected.length) return;
    if (!selected.includes(main)) setMain(selected[0]);
  }, [selected, main]);


  const toggle = (sym: string) => {
    setSelectedState((prev) => {
      const key = sym.toUpperCase();
      const has = prev.includes(key);
      const next = has ? prev.filter((x) => x !== key) : [...prev, key];
      const capped = next.slice(0, 20);

      // ✅ persistimos en store
      setSymbols(capped);

      // asegura main razonable
      if (!capped.includes(main) && capped[0]) setMain(capped[0]);

      return capped;
    });
  };

  const [showDev, setShowDev] = useState(false);

useEffect(() => {
  // ✅ solo abre dev tools si hay flag en URL o localStorage
  const qs = new URLSearchParams(window.location.search);
  const flag = qs.get("dev") === "1" || localStorage.getItem("cryptolink:dev") === "1";
  setShowDev(flag);
}, []);

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
      title="Symbols"
      subtitle="watchlist · Chart overlays · Real-time view"
      badge="BETA"
    />
      <StatusBar
        items={[
          {
            label: "Symbols",
            ok: true,
            lastOkAt: pricesHealth?.lastOkAt,
          },
        ]}
        trailingLabel="watchlist · compare · overlays"
      />
      <MarketMood
        score={mood.score}
        confidence={mood.confidence}
        updatedAt={moodUpdatedAt}
        insight={moodInsight}
        />
      
        {/* 👇 asegura que el chart tenga espacio en iPhone */}
        <div className="min-h-[320px] sm:min-h-[360px]">
          <PriceComparePanel rows={rows} symbol={main} onSymbolChange={setMain} />
        </div>
      </div>    
  );
}