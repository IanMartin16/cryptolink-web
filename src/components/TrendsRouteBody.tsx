"use client";

import { useState, useEffect } from "react";
import StatusBar from "@/components/StatusBar";
import type { TrendItem } from "@/lib/types";
import type { Health } from "@/lib/health";
import MarketMomentumPanel from "./MarketMomentumPanel";
import RegimePanel from "@/components/RegimePanel";
import MarketAttentionTable from "./MarketAttentionTable";
import AttentionPulsePanel from "./AttentionPulsePanel";
import { AttentionRow } from "@/lib/useMarketAttention";


export function TrendsWarmup() {
  useEffect(() => {
    async function warm() {
      try {
        await fetch("/api/cryptolink/prices?symbols=BTC,ETH,SOL&fiat=USD", {
          cache: "no-store",
        });
      } catch {
        // silent on purpose
      }
    }

    warm();
    const id = setInterval(warm, 10000);

    return () => clearInterval(id);
  }, []);

  return null;
}

export default function TrendsRouteBody() {
  const [trendsHealth, setTrendsHealth] = useState<Health | undefined>(undefined);
  const [trendItems, setTrendItems] = useState<TrendItem[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionRow[]>([]);

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
        <MarketMomentumPanel topN={5} />
        <TrendsWarmup />
      </div>
    </div>
      <div style={{ marginTop: 12 }}>
        <AttentionPulsePanel items={attentionItems} maxPoints={40}/>
      </div>
      <div>
      <MarketAttentionTable onItems={setAttentionItems} onHealth={setTrendsHealth} />
      </div>
    </>
  );
}
