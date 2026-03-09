"use client";

import { useState } from "react";
import TrendsTable from "@/components/TrendsTable";
import StatusBar from "@/components/StatusBar";
import TrendChartPanel from "@/components/TrendChartPanel";
import type { TrendItem } from "@/lib/types";
import type { Health } from "@/lib/health";
import MomentumPanel from "@/components/MomentumPanel";
import TrendsPanel from "@/components/TrendsPanel";
import RegimePanel from "@/components/RegimePanel";


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
          gap: 20,
          marginTop: 16,
        }}
      >
        <RegimePanel />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 20,
            alignItems: "start",
          }}
        >
        <MomentumPanel />
        <TrendsPanel />
      </div>
    </div>
      <div style={{ marginTop: 12 }}>
        <TrendChartPanel items={trendItems} maxPoints={60}/>
      </div>
      <div>
      <TrendsTable onItems={setTrendItems} onHealth={setTrendsHealth} />
      </div>
    </>
  );
}
