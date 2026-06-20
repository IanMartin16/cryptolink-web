"use client";

import { useEffect } from "react";
import StatusBar from "@/components/StatusBar";
import PricesSplit from "@/components/PricesSplit";
import PricesHeaderBar from "@/components/PricesHeaderBar";
import SignalsRadarPanel from "@/components/SignalsRadarPanel";
import { pushPricesToHistory } from "@/lib/priceHistoryStore";
import { usePricesFeed } from "@/lib/hooks/usePricesFeed";


export default function PricesRouteBody() {
  const {
    rows,
    error,
    loading,
    refreshing,
    auto,
    setAuto,
    lastUpdated,
    symbolsCount,
    fiatLabel,
    flashRow,
  } = usePricesFeed({});

  // historial de precios (lo seguimos alimentando para sparklines de la tabla)
  useEffect(() => {
    if (!rows.length) return;
    pushPricesToHistory(rows);
  }, [rows]);

  // salud derivada del feed para el StatusBar (antes venía por onHealth)
  const pricesHealth = error
    ? { ok: false, lastErr: error }
    : { ok: true, lastOkAt: lastUpdated };

  return (
    <div className="space-y-4">
      <StatusBar prices={pricesHealth} />

      <PricesHeaderBar
        rows={rows}
        health={pricesHealth}
        fiat={rows[0]?.fiat ?? fiatLabel ?? "USD"}
        assetsCount={rows.length || symbolsCount}
        lastUpdated={rows[0]?.updatedAt ?? lastUpdated}
      />

      <SignalsRadarPanel />

      {/* Tabla principal: Watchlist + Top Movers (gainers/losers ya cableado).
          Ahora también recibe meta de frescura para el indicador legible. */}
      <PricesSplit
        rows={rows}
        lastUpdated={lastUpdated}
        live={auto && (refreshing || loading || rows.length > 0)}
      />
    </div>
  );
}
