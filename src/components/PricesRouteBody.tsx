"use client";

import { useEffect, useState } from "react";
import StatusBar from "@/components/StatusBar";
import PricesSplit from "@/components/PricesSplit";
import PricesHeaderBar from "@/components/PricesHeaderBar";
import SignalsRadarPanel from "@/components/SignalsRadarPanel";
import { pushPricesToHistory } from "@/lib/priceHistoryStore";
import { usePricesFeed } from "@/lib/hooks/usePricesFeed";
import { getFiat } from "@/lib/fiatStore";
import { getSymbols } from "@/lib/symbolsStore";
import { fetchSymbols360, type SymbolMarket } from "@/lib/cryptoLink";

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

  // ---- Datos ricos de CoinGecko (24h real + volumen) para Top Movers ----
  // Una sola llamada aquí en el contenedor; se baja como prop a PricesSplit.
  // Híbrido: la Watchlist usa el feed interno (precio en vivo 15s); Top Movers
  // usa estos datos de 24h real. Cada mitad con su fuente ideal.
  // Intervalo amplio (5 min): CoinGecko cambia lento + BFF cachea + free tier.
  const [markets, setMarkets] = useState<SymbolMarket[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadMarkets() {
      try {
        const fiat = getFiat();
        const list = getSymbols();
        const symbols = list.length ? list : ["BTC", "ETH", "SOL"];
        const res = await fetchSymbols360(symbols, fiat);
        if (!cancelled) setMarkets(res.symbols ?? []);
      } catch {
        // si CoinGecko falla, Top Movers cae a su modo previo (Δ% sesión) sin romper
        if (!cancelled) setMarkets([]);
      }
    }

    loadMarkets();
    const id = setInterval(loadMarkets, 300000); // 5 min

    // reactividad global del portal (mismo contrato que los demás paneles)
    const onFiat = () => loadMarkets();
    const onSymbols = () => loadMarkets();
    window.addEventListener("cryptolink:fiat" as any, onFiat);
    window.addEventListener("cryptolink:symbols" as any, onSymbols);

    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("cryptolink:fiat" as any, onFiat);
      window.removeEventListener("cryptolink:symbols" as any, onSymbols);
    };
  }, []);

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

      {/* Tabla principal: Watchlist (precio en vivo) + Top Movers (24h real + volumen).
          markets = datos ricos de CoinGecko, cruzados por símbolo en Top Movers. */}
      <PricesSplit
        rows={rows}
        markets={markets}
        lastUpdated={lastUpdated}
        live={auto && (refreshing || loading || rows.length > 0)}
      />
    </div>
  );
}
