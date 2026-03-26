"use client";

import { useEffect, useState } from "react";
import PricesPanel from "@/components/PricesPanel";
import StatusBar from "@/components/StatusBar";
import type { PriceRow } from "@/lib/types";
import MarketPulse from "@/components/MarketPulse";
import PricesSplit from "@/components/PricesSplit";
import { pushPricesToHistory } from "@/lib/priceHistoryStore";
import { getPricesSnapshot, setPricesSnapshot } from "@/lib/pricesSnapshotStore";
import PricesHeaderBar from "@/components/PricesHeaderBar";
import SignalsRadarPanel from "@/components/SignalsRadarPanel";

export default function PricesRouteBody() {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [pricesHealth, setPricesHealth] = useState<any>(undefined);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cached = getPricesSnapshot();
    if (cached.length) {
      setRows(cached);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!rows.length) return;
    pushPricesToHistory(rows);
    setPricesSnapshot(rows);
  }, [rows]);

  return (
    <div className="space-y-4">
      <StatusBar prices={pricesHealth} />

      <PricesHeaderBar
        rows={rows}
        health={pricesHealth}
        fiat={rows[0]?.fiat ?? "USD"}
        assetsCount={rows.length}
        lastUpdated={rows[0]?.updatedAt}
      />

      <SignalsRadarPanel />
      <MarketPulse rows={rows} max={20} />

      <PricesPanel onRows={setRows} onHealth={setPricesHealth} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <PricesSplit rows={rows} />
        </div>
      </div>
    </div>
  );
}