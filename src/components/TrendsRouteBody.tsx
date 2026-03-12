"use client";

import { useState, useEffect } from "react";
import TrendsTable from "@/components/TrendsTable";
import StatusBar from "@/components/StatusBar";
import TrendChartPanel from "@/components/TrendChartPanel";
import type { TrendItem } from "@/lib/types";
import type { Health } from "@/lib/health";
import MomentumPanel from "@/components/MomentumPanel";
import TrendsPanel from "@/components/TrendsPanel";
import RegimePanel from "@/components/RegimePanel";
import { fetchPricesBatch } from "@/lib/cryptoLink";

export function TrendsWarmup() {
  useEffect(() => {
    let cancelled = false;

    async function warm() {
      try {
        await fetchPricesBatch( ["BTC", "ETH", "SOL", "LINK", "UNI", "ATOM"], "USD", "");
      } catch {
        // silencioso a propósito
      }
    }

    warm();
    const id = setInterval(warm, 10000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return null;
}

export default function TrendsRouteBody() {
  const [trendsHealth, setTrendsHealth] = useState<Health | undefined>(undefined);
  const [trendItems, setTrendItems] = useState<TrendItem[]>([]);

  return (
    <>
      <div style={{ marginTop: 12 }}>
        <StatusBar trends={trendsHealth} />
      </div>
      <div
        style={{
          display: "grid",
          gap: 16,
          marginTop: 16,
        }}
      >
        <RegimePanel />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
        <MomentumPanel />
        <TrendsWarmup />
        <TrendsPanel />
      </div>
    </div>
      <div style={{ marginTop: 12 }}>
        <TrendChartPanel items={trendItems} maxPoints={40}/>
      </div>
      <div>
      <TrendsTable onItems={setTrendItems} onHealth={setTrendsHealth} />
      </div>
    </>
  );
}
