"use client";

import { useEffect, useMemo, useState } from "react";
import type { PriceRow } from "@/lib/types";
import {
  getMarketPulsePrefs,
  setMarketPulsePrefs,
} from "@/lib/marketPulseStore";

function tone(pct?: number) {
  if (typeof pct !== "number") return "rgba(255,255,255,0.08)";
  if (pct > 1) return "rgba(46,229,157,0.42)";
  if (pct > 0) return "rgba(46,229,157,0.22)";
  if (pct < -1) return "rgba(255,107,107,0.42)";
  if (pct < 0) return "rgba(255,107,107,0.22)";
  return "rgba(255,255,255,0.10)";
}

export default function MarketPulse({
  rows,
  max = 20,
  title = "MARKET PULSE",
}: {
  rows: PriceRow[];
  max?: number;
  title?: string;
}) {
  const [panelMax, setPanelMax] = useState<number>(max);
  const [compact, setCompact] = useState<boolean>(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prefs = getMarketPulsePrefs();
    console.log("loaded marketPulse prefs", prefs);

    setPanelMax(prefs.max);
    setCompact(prefs.compact);
    setReady(true);
  }, []);

  const items = useMemo(
    () =>
      [...(rows || [])]
        .filter((r) => r && r.symbol)
        .slice(0, panelMax),
    [rows, panelMax]
  );

  const toggleCompact = () => {
    const nextCompact = !compact;
    setCompact(nextCompact);
    setMarketPulsePrefs({ max: panelMax, compact: nextCompact });
  };

  const cycleMax = () => {
    const nextMax = panelMax === 8 ? 12 : panelMax === 12 ? 16 : 8;
    setPanelMax(nextMax);
    setMarketPulsePrefs({ max: nextMax, compact });
  };

  if (!ready) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-semibold tracking-[0.16em] text-amber-300/80">
            {title}
          </div>
          <div className="mt-1 text-[11px] text-white/45">
            {items.length ? `${items.length} assets in pulse view` : "Waiting for prices"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleMax}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.06]"
            title="Cycle visible assets"
          >
            {panelMax} assets
          </button>

          <button
            onClick={toggleCompact}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.06]"
            title="Toggle density"
          >
            {compact ? "Compact" : "Expanded"}
          </button>
        </div>
      </div>

      <div
        className={[
          "mt-3 grid gap-2",
          compact
            ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
            : "grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
        ].join(" ")}
      >
        {items.map((r) => (
          <div
            key={r.symbol}
            title={`${r.symbol}${typeof r.pct === "number" ? ` • ${r.pct.toFixed(2)}%` : ""}`}
            className={[
              "rounded-xl border border-white/10 font-semibold text-white/82",
              compact ? "px-2.5 py-2 text-[11px]" : "px-3 py-3 text-xs",
            ].join(" ")}
            style={{
              background: tone(r.pct),
              backdropFilter: "blur(6px)",
              boxShadow: "inset 0 0 12px rgba(255,255,255,0.012)",
            }}
          >
            <div className="truncate">{r.symbol}</div>
            <div className="mt-0.5 truncate text-[10px] tabular-nums text-white/68">
              {typeof r.pct === "number"
                ? `${r.pct > 0 ? "+" : ""}${r.pct.toFixed(1)}%`
                : "—"}
            </div>
          </div>
        ))}

        {!items.length ? (
          <div className="col-span-full py-3 text-sm text-white/50">
            Waiting for prices…
          </div>
        ) : null}
      </div>
    </div>
  );
}