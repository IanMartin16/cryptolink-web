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
import TrendPulsePanel from "@/components/TrendPulse";


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
        <TrendsPanel />
      </div>
    </div>
      <div style={{ marginTop: 12 }}>
        <TrendPulsePanel />
      </div>
      <div>
      <TrendsTable onItems={setTrendItems} onHealth={setTrendsHealth} />
      </div>
    </>
  );
}
