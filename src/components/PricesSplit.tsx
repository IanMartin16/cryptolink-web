"use client";

import { useMemo, useState, useEffect } from "react";
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

import { useState, useEffect } from "react";

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
  // tick cada 1s para que "Xs ago" avance aunque no lleguen datos nuevos
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1_000_000), 1000);
    return () => clearInterval(id);   // limpieza: sin fugas de timer
  }, []);

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

  const marketMap = useMemo(() => {
    const m = new Map<string, SymbolMarket>();
    for (const s of markets) m.set(s.symbol.toUpperCase(), s);
    return m;
  }, [markets]);


  const watch = useMemo(() => sortForWatchlist(rows || []), [rows]);

  // ¿tenemos datos de CoinGecko? Si no, Top Movers lo dice honestamente.
  const hasMarkets = marketMap.size > 0;

  return (
    <div className="w-full">
      {/* LEFT: WATCHLIST (precio en vivo, Δ% sesión) — sin cambios */}
      <div className="w-full rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold tracking-wide text-white/70">{titleLeft}</div>
            <FreshnessTag live={live} lastUpdated={lastUpdated} />
          </div>
          <div className="text-[11px] text-white/45" title="A rotating daily selection across the market · refreshes every 24h">
            {watch.length} assets · rotating daily
          </div>
        </div>

        <div className="max-h-[1080px] overflow-auto">
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
                    <td className="flex flex-col min-w-0">
                          {fullName ? (
                            <div className="border-t border-white/5 hover:bg-white/[0.04]">
                              {fullName}
                            </div>
                          ) : null}
                        </td>
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
    </div>
  );
}
