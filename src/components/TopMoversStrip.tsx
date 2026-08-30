"use client";

import { useMemo } from "react";
import type { PriceRow } from "@/lib/types";
import type { SymbolMarket } from "@/lib/cryptoLink";
import SymbolCell from "@/components/SymbolCell";

/**
 * TopMoversStrip — tira discreta arriba de Prices.
 * Muestra 5 gainers + 5 losers al mismo tiempo (sin selector), por Δ% 24h REAL
 * de CoinGecko (markets payload). La data ya existía en PricesSplit/buildMovers;
 * esto solo la EXPONE mejor (antes vivía tras un selector que arrancaba en "all"
 * y escondía la mitad).
 *
 * Cero backend nuevo: cruza rows (precio en vivo) con markets (change24h real),
 * igual que buildMovers, pero separa en dos grupos y ordena cada uno por su lado
 * para GARANTIZAR ver ambos siempre (el buildMovers viejo ordenaba por magnitud
 * absoluta y podía dar 13 gainers / 0 losers en día verde).
 */

type MoverRow = {
  symbol: string;
  fiat?: string;
  price?: number;
  change24h: number;
};

function fmtPrice(n?: number) {
  if (typeof n !== "number") return "—";
  return n >= 1000 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n.toFixed(6);
}

function buildTwoGroups(
  rows: PriceRow[],
  marketMap: Map<string, SymbolMarket>,
  perSide = 5
): { gainers: MoverRow[]; losers: MoverRow[] } {
  const all: MoverRow[] = [];
  for (const r of rows) {
    const m = marketMap.get(r.symbol.toUpperCase());
    if (!m || typeof m.change24h !== "number" || !Number.isFinite(m.change24h)) continue;
    all.push({
      symbol: r.symbol,
      fiat: r.fiat,
      price: typeof r.price === "number" ? r.price : (m.price ?? undefined),
      change24h: m.change24h,
    });
  }

  const gainers = all
    .filter((r) => r.change24h > 0)
    .sort((a, b) => b.change24h - a.change24h)   // mayor subida primero
    .slice(0, perSide);

  const losers = all
    .filter((r) => r.change24h < 0)
    .sort((a, b) => a.change24h - b.change24h)   // más negativo primero
    .slice(0, perSide);

  return { gainers, losers };
}

function MoverPill({ r }: { r: MoverRow }) {
  const up = r.change24h > 0;
  const c = up ? "text-emerald-300" : "text-rose-300";
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5">
      <SymbolCell symbol={r.symbol} fiat={r.fiat} />
      <div className="flex items-center gap-2">
        <span className="text-xs tabular-nums text-white/70">{fmtPrice(r.price)}</span>
        <span className={`text-xs font-semibold tabular-nums ${c}`}>
          {up ? "+" : ""}
          {r.change24h.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function Group({
  title,
  arrow,
  tone,
  rows,
}: {
  title: string;
  arrow: string;
  tone: "up" | "down";
  rows: MoverRow[];
}) {
  const headColor = tone === "up" ? "text-emerald-300" : "text-rose-300";
  return (
    <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className={`text-xs font-semibold tracking-wide ${headColor}`}>
          {arrow} {title}
        </div>
        <div className="text-[11px] text-white/45">24h</div>
      </div>
      <div className="space-y-1.5 p-2">
        {rows.length ? (
          rows.map((r) => <MoverPill key={r.symbol} r={r} />)
        ) : (
          <div className="px-2 py-3 text-xs text-white/45">No {title.toLowerCase()} right now.</div>
        )}
      </div>
    </div>
  );
}

export default function TopMoversStrip({
  rows,
  markets = [],
  perSide = 5,
}: {
  rows: PriceRow[];
  markets?: SymbolMarket[];
  perSide?: number;
}) {
  const marketMap = useMemo(() => {
    const m = new Map<string, SymbolMarket>();
    for (const s of markets) m.set(s.symbol.toUpperCase(), s);
    return m;
  }, [markets]);

  const { gainers, losers } = useMemo(
    () => buildTwoGroups(rows || [], marketMap, perSide),
    [rows, marketMap, perSide]
  );

  const hasMarkets = marketMap.size > 0;

  // si aún no hay markets, no ocupamos espacio con una tira vacía
  if (!hasMarkets && gainers.length === 0 && losers.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Group title="Top Gainers" arrow="▲" tone="up" rows={gainers} />
      <Group title="Top Losers" arrow="▼" tone="down" rows={losers} />
    </div>
  );
}
