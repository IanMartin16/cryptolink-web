"use client";

import { useMemo } from "react";
import HeroPriceCard from "@/components/HeroPriceCard";
import type { PriceRow } from "@/lib/types";

type Row = {
  symbol: string;
  fiat: string;
  cache?: string;
  price?: number;
  ok?: boolean;
};

export default function StatCards({ rows }: { rows: PriceRow[] }) {
  const map = useMemo(() => new Map(rows.map((r) => [r.symbol, r])), [rows]);

  const btc = map.get("BTC");
  const eth = map.get("ETH");

  // Si BTC no existe todavía, agarra fiat del primer row para evitar fallback raro.
  const fiat = btc?.fiat ?? rows[0]?.fiat ?? "USD";

  return (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <HeroPriceCard symbol="BTC" fiat={fiat} price={btc?.price} cache={btc?.cache} />
    <HeroPriceCard symbol="ETH" fiat={fiat} price={eth?.price} cache={eth?.cache} />
  </div>
);
}
