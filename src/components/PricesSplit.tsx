"use client";

import { useMemo, useState } from "react";
import type { PriceRow } from "@/lib/types";
import SymbolCell from "@/components/SymbolCell";
import Sparkline from "@/components/Sparkline";
import { getPriceHistory } from "@/lib/usePriceHistory";

function fmtPrice(n?: number) {
  if (typeof n !== "number") return "—";
  return n >= 1000 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n.toFixed(6);
}

function PctCell({ pct }: { pct?: number | null }) {
  if (typeof pct !== "number") return <span className="text-white/45">—</span>;

  const cls =
    pct > 0 ? "text-emerald-300" : pct < 0 ? "text-rose-300" : "text-white/70";

  return (
    <span className={`font-semibold tabular-nums ${cls}`}>
      {pct > 0 ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

function effectivePct(r: PriceRow) {
  if (typeof r.pct === "number") return r.pct;

  if (
    typeof r.price === "number" &&
    typeof r.prevPrice === "number" &&
    r.prevPrice !== 0
  ) {
    return ((r.price - r.prevPrice) / r.prevPrice) * 100;
  }

  const hist = getPriceHistory(r.symbol);
  if (hist.length >= 2) {
    const first = hist[0];
    const last = hist[hist.length - 1];
    if (typeof first === "number" && typeof last === "number" && first !== 0) {
      return ((last - first) / first) * 100;
    }
  }

  return null;
}

function sortForWatchlist(rows: PriceRow[]) {
  return [...rows].sort((a, b) => {
    const ao = a.ok ? 0 : 1;
    const bo = b.ok ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return (a.symbol || "").localeCompare(b.symbol || "");
  });
}

function sortTopMovers(rows: PriceRow[], filter: "all" | "gainers" | "losers") {
  return [...rows]
    .map((r) => ({
      ...r,
      effectivePct: effectivePct(r),
    }))
    .filter((r) => typeof r.effectivePct === "number")
    .filter((r) => {
      const p = r.effectivePct ?? 0;
      if (filter === "gainers") return p > 0;
      if (filter === "losers") return p < 0;
      return true;
    })
    .sort((a, b) => {
      const ao = a.ok ? 0 : 1;
      const bo = b.ok ? 0 : 1;
      if (ao !== bo) return ao - bo;

      const ap = Math.abs(a.effectivePct ?? 0);
      const bp = Math.abs(b.effectivePct ?? 0);
      if (bp !== ap) return bp - ap;

      return (a.symbol || "").localeCompare(b.symbol || "");
    })
    .slice(0, 5);
}

function sparkTone(pct?: number | null) {
  if (typeof pct !== "number") {
    return {
      stroke: "rgba(255,255,255,0.50)",
      fill: "rgba(255,255,255,0.06)",
    };
  }

  if (pct > 0) {
    return {
      stroke: "rgba(46,229,157,0.85)",
      fill: "rgba(46,229,157,0.10)",
    };
  }

  if (pct < 0) {
    return {
      stroke: "rgba(255,107,107,0.85)",
      fill: "rgba(255,107,107,0.10)",
    };
  }

  return {
    stroke: "rgba(255,255,255,0.55)",
    fill: "rgba(255,255,255,0.06)",
  };
}

export default function PricesSplit({
  rows,
  max = 12,
  titleLeft = "WATCHLIST",
  titleRight = "TOP MOVERS",
}: {
  rows: PriceRow[];
  max?: number;
  titleLeft?: string;
  titleRight?: string;
}) {
  const [moversFilter, setMoversFilter] = useState<"all" | "gainers" | "losers">("all");

  const movers = useMemo(
    () => sortTopMovers(rows || [], moversFilter),
    [rows, moversFilter]
  );

  const watch = useMemo(() => sortForWatchlist(rows || []), [0, max, rows]);

  function fmtTick(rows: PriceRow[]) {
    const t = rows.find((r) => r.updatedAt)?.updatedAt;
    if (!t) return "—";
    return new Date(t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* LEFT: WATCHLIST */}
      <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="text-xs font-semibold tracking-wide text-white/70">
            {titleLeft}
          </div>
          <div className="text-[11px] text-white/45">
            {watch.length} assets
          </div>
        </div>

        <div className="max-h-[420px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-black/20 backdrop-blur">
              <tr className="text-[11px] text-white/55">
                <th className="px-3 py-2 text-left font-medium">Asset</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">Δ%</th>
                <th className="px-3 py-2 text-right font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {watch.map((r) => {
                const pct = effectivePct(r);
                const hist = getPriceHistory(r.symbol).slice(-20);
                const tone = sparkTone(pct);

                return (
                  <tr
                    key={r.symbol}
                    className="border-t border-white/5 hover:bg-white/[0.04]"
                  >
                    <td className="px-3 py-2">
                      <SymbolCell symbol={r.symbol} fiat={r.fiat} />
                    </td>

                    <td className="px-3 py-2 text-right tabular-nums text-white/85">
                      {fmtPrice(r.price)}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <PctCell pct={pct} />
                    </td>

                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center justify-end">
                        <Sparkline
                          values={hist}
                          w={72}
                          h={18}
                          stroke={tone.stroke}
                          fill={tone.fill}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!watch.length ? (
                <tr>
                  <td className="px-3 py-6 text-sm text-white/50" colSpan={4}>
                    No prices yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: TOP MOVERS */}
      <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="text-xs font-semibold tracking-wide text-white/70">
            {titleRight}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["all", "gainers", "losers"] as const).map((k) => {
                const active = moversFilter === k;
                const label = k === "all" ? "All" : k === "gainers" ? "▲" : "▼";

                return (
                  <button
                    key={k}
                    onClick={() => setMoversFilter(k)}
                    className={[
                      "rounded-md border px-2 py-0.5 text-[11px] font-semibold transition",
                      active
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06]",
                    ].join(" ")}
                    aria-pressed={active}
                    title={k}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-white/45">
            {movers.length ? fmtTick(rows) : "—"}
          </div>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-auto p-2">
          {movers.map((r) => {
            const pct = effectivePct(r);
            const hist = getPriceHistory(r.symbol).slice(-20);
            const tone = sparkTone(pct);

            return (
              <div
                key={r.symbol}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2 py-2"
              >
                <div className="min-w-0">
                  <SymbolCell symbol={r.symbol} fiat={r.fiat} />
                </div>

                <div className="flex items-center gap-3">
                  <Sparkline
                    values={hist}
                    w={64}
                    h={18}
                    stroke={tone.stroke}
                    fill={tone.fill}
                  />

                  <div className="flex flex-col items-end leading-tight">
                    <div className="text-sm tabular-nums text-white/85">
                      {fmtPrice(r.price)}
                    </div>
                    <div className="text-xs">
                      <PctCell pct={pct} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!movers.length ? (
            <div className="px-2 py-4 text-sm text-white/50">
              Collecting enough movement data...
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}