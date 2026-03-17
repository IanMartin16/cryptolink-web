"use client";

import { useMemo } from "react";
import HeroPriceCard from "@/components/HeroPriceCard";
import type { PriceRow } from "@/lib/types";

export default function StatCards({ rows }: { rows: PriceRow[] }) {
  const map = useMemo(() => new Map(rows.map((r) => [r.symbol, r])), [rows]);

  const btc = map.get("BTC");
  const eth = map.get("ETH");

  const fiat = btc?.fiat || eth?.fiat || rows[0]?.fiat || "USD";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <HeroPriceCard symbol="BTC" fiat={fiat} price={btc?.price} cache={btc?.cache} />
      <HeroPriceCard symbol="ETH" fiat={fiat} price={eth?.price} cache={eth?.cache} />
    </div>
  );
}