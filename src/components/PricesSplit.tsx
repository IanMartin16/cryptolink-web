"use client";

import { useMemo, useState } from "react";
import type { PriceRow } from "@/lib/types";
import type { SymbolMarket } from "@/lib/cryptoLink";
import SymbolCell from "@/components/SymbolCell";
import { getSymbolName } from "@/lib/symbolMeta";
import Sparkline from "@/components/Sparkline";
import { getPriceHistory } from "@/lib/usePriceHistory";

function fmtPrice(n?: number) {
  if (typeof n !== "number") return "—";
  return n >= 1000 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n.toFixed(6);
}

function fmtVol(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(2) + "K";
  return "$" + v.toFixed(0);
}

function PctCell({ pct }: { pct?: number | null }) {
  if (typeof pct !== "number") return <span className="text-white/45">—</span>;
  const cls = pct > 0 ? "text-emerald-300" : pct < 0 ? "text-rose-300" : "text-white/70";
  return (
    <span className={`font-semibold tabular-nums ${cls}`}>
      {pct > 0 ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

/**
 * effectivePct (SESSION): cambio de sesión calculado en el front.
 * Se usa SOLO en la Watchlist (izquierda), que muestra precio en vivo.
 */
function effectivePct(r: PriceRow) {
  if (typeof r.pct === "number") return r.pct;
  if (typeof r.price === "number" && typeof r.prevPrice === "number" && r.prevPrice !== 0) {
    return ((r.price - r.prevPrice) / r.prevPrice) * 100;
  }
  const hist = getPriceHistory(r.symbol, r.fiat ?? "USD");
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

function sparkTone(pct?: number | null) {
  if (typeof pct !== "number") return { stroke: "rgba(255,255,255,0.50)", fill: "rgba(255,255,255,0.06)" };
  if (pct > 0) return { stroke: "rgba(46,229,157,0.85)", fill: "rgba(46,229,157,0.10)" };
  if (pct < 0) return { stroke: "rgba(255,107,107,0.85)", fill: "rgba(255,107,107,0.10)" };
  return { stroke: "rgba(255,255,255,0.55)", fill: "rgba(255,255,255,0.06)" };
}

function freshness(lastUpdated?: string | number) {
  if (!lastUpdated) return null;
  const t = new Date(lastUpdated).getTime();
  if (Number.isNaN(t)) return null;
  const secs = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  return `${mins}m ago`;
}

function FreshnessTag({ live, lastUpdated }: { live?: boolean; lastUpdated?: string | number }) {
  const ago = freshness(lastUpdated);
  const dot = live ? "rgba(46,229,157,0.95)" : "rgba(255,255,255,0.30)";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-white/45">
      <span style={{ width: 7, height: 7, borderRadius: 999, background: dot, boxShadow: live ? `0 0 8px ${dot}` : "none", display: "inline-block" }} />
      {live ? "live" : "idle"}
      {ago ? <span className="text-white/30">· {ago}</span> : null}
    </span>
  );
}

// ---- TOP MOVERS reforzado: cruza rows (precio en vivo) con markets (CoinGecko) ----
// Cada mover = símbolo + precio en vivo + Δ% 24h REAL + volumen 24h.
// Ordena por Δ% 24h real. Los símbolos sin datos de CoinGecko quedan fuera
// del ranking de movers (no se puede rankear sin el 24h real), pero la
// Watchlist los sigue mostrando con su precio en vivo.

type MoverRow = {
  symbol: string;
  fiat?: string;
  price?: number;
  ok?: boolean;
  change24h: number;     // 24h REAL de CoinGecko
  volume24h?: number | null;
};

function buildMovers(
  rows: PriceRow[],
  marketMap: Map<string, SymbolMarket>,
  filter: "all" | "gainers" | "losers"
): MoverRow[] {
  const out: MoverRow[] = [];

  for (const r of rows) {
    const m = marketMap.get(r.symbol.toUpperCase());
    // solo entra al ranking si CoinGecko nos dio el 24h real
    if (!m || typeof m.change24h !== "number" || !Number.isFinite(m.change24h)) continue;

    out.push({
      symbol: r.symbol,
      fiat: r.fiat,
      price: typeof r.price === "number" ? r.price : (m.price ?? undefined),
      ok: r.ok,
      change24h: m.change24h,
      volume24h: m.volume24h,
    });
  }

  return out
    .filter((r) => {
      if (filter === "gainers") return r.change24h > 0;
      if (filter === "losers") return r.change24h < 0;
      return true;
    })
    .sort((a, b) => {
      const ao = a.ok ? 0 : 1;
      const bo = b.ok ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return Math.abs(b.change24h) - Math.abs(a.change24h);
    })
    .slice(0, 5);
}

export default function PricesSplit({
  rows,
  markets = [],
  titleLeft = "WATCHLIST",
  titleRight = "TOP MOVERS",
  lastUpdated,
  live,
}: {
  rows: PriceRow[];
  markets?: SymbolMarket[];
  titleLeft?: string;
  titleRight?: string;
  lastUpdated?: string | number;
  live?: boolean;
}) {
  const [moversFilter, setMoversFilter] = useState<"all" | "gainers" | "losers">("all");

  const marketMap = useMemo(() => {
    const m = new Map<string, SymbolMarket>();
    for (const s of markets) m.set(s.symbol.toUpperCase(), s);
    return m;
  }, [markets]);

  const movers = useMemo(
    () => buildMovers(rows || [], marketMap, moversFilter),
    [rows, marketMap, moversFilter]
  );

  const watch = useMemo(() => sortForWatchlist(rows || []), [rows]);

  // ¿tenemos datos de CoinGecko? Si no, Top Movers lo dice honestamente.
  const hasMarkets = marketMap.size > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* LEFT: WATCHLIST (precio en vivo, Δ% sesión) — sin cambios */}
      <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold tracking-wide text-white/70">{titleLeft}</div>
            <FreshnessTag live={live} lastUpdated={lastUpdated} />
          </div>
          <div className="text-[11px] text-white/45">{watch.length} assets</div>
        </div>

        <div className="max-h-[720px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-black/20 backdrop-blur">
              <tr className="text-[11px] text-white/55">
                <th className="px-3 py-2 text-left font-medium">Asset</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">Δ% session</th>
                <th className="px-3 py-2 text-right font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {watch.map((r) => {
                const pct = effectivePct(r);
                const hist = getPriceHistory(r.symbol, r.fiat ?? "USD").slice(-20);
                const tone = sparkTone(pct);
                const fullName = getSymbolName(r.symbol);
                return (
                  <tr key={r.symbol} className="border-t border-white/5 hover:bg-white/[0.04]">
                    <td className="px-3 py-2"><SymbolCell symbol={r.symbol} fiat={r.fiat}/> </td>
                    <th className="flex flex-col min-w-0">
                          {fullName ? (
                            <div className="border-t border-white/5 hover:bg-white/[0.04]">
                              {fullName}
                            </div>
                          ) : null}
                        </th>
                    <td className="px-3 py-2 text-right tabular-nums text-white/85">{fmtPrice(r.price)}</td>
                    <td className="px-3 py-2 text-right"><PctCell pct={pct} /></td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center justify-end">
                        <Sparkline values={hist} w={72} h={18} stroke={tone.stroke} fill={tone.fill} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!watch.length ? (
                <tr><td className="px-3 py-6 text-sm text-white/50" colSpan={4}>No prices yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT: TOP MOVERS (24h REAL + volumen, de CoinGecko) */}
      <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="text-xs font-semibold tracking-wide text-white/70">{titleRight}</div>
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
                      active ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06]",
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
          <div className="text-[11px] text-white/45">24h</div>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-auto p-2">
          {movers.map((r) => {
            const hist = getPriceHistory(r.symbol, r.fiat ?? "USD").slice(-20);
            const tone = sparkTone(r.change24h);
            return (
              <div key={r.symbol} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2 py-2">
                <div className="min-w-0">
                  <SymbolCell symbol={r.symbol} fiat={r.fiat} />
                  {/* volumen como contexto debajo del símbolo */}
                  <div className="mt-0.5 text-[10px] text-white/40">
                    Vol {fmtVol(r.volume24h)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Sparkline values={hist} w={64} h={18} stroke={tone.stroke} fill={tone.fill} />
                  <div className="flex flex-col items-end leading-tight">
                    <div className="text-sm tabular-nums text-white/85">{fmtPrice(r.price)}</div>
                    <div className="text-xs"><PctCell pct={r.change24h} /></div>
                  </div>
                </div>
              </div>
            );
          })}

          {!movers.length ? (
            <div className="px-2 py-4 text-sm text-white/50">
              {hasMarkets ? "No movers in this filter." : "Loading 24h market data…"}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
