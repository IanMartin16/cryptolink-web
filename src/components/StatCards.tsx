"use client";

import { useMemo } from "react";
import HeroPriceCard from "@/components/HeroPriceCard";
import { useOverviewPrices } from "@/lib/hooks/useOverviewPrices";

/**
 * StatCards — cards gigantes de Overview (BTC, ETH).
 *
 * Ahora usa useOverviewPrices (símbolos FIJOS BTC/ETH, cacheados) en vez de
 * recibir las rows de usePricesFeed (la selección del usuario). Esto desacopla
 * Overview de la selección y hace que la llamada sea cacheable -> N visitantes
 * concurrentes comparten la llamada -> rompe el N=N que topaba Vercel.
 *
 * Ya NO recibe `rows` como prop. El padre puede dejar de pasárselas.
 * usePricesFeed sigue vivo para Watchlist/Top Movers (la selección), intacto.
 */
export default function StatCards() {
  const { prices } = useOverviewPrices();

  const map = useMemo(
    () => new Map(prices.map((p) => [p.symbol, p])),
    [prices]
  );

  const btc = map.get("BTC");
  const eth = map.get("ETH");

  const fiat = "USD"; // Overview cards en USD (audiencia internacional)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <HeroPriceCard
        symbol="BTC"
        fiat={fiat}
        price={btc?.price}
        cache={btc?.source === "stale-cache" ? "HIT" : "LIVE"}
        change24h={btc?.change24h}
      />
      <HeroPriceCard
        symbol="ETH"
        fiat={fiat}
        price={eth?.price}
        cache={eth?.source === "stale-cache" ? "HIT" : "LIVE"}
        change24h={eth?.change24h}
      />
    </div>
  );
}
