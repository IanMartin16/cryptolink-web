"use client";

import { getChartWatch, toggleChartWatch } from "@/lib/chartWatchStore";
import { useEffect, useMemo, useState } from "react";

export default function SymbolChips({
  symbols,
  selected,
  onToggle,
}: {
  symbols: string[];
  selected: string[];
  onToggle: (sym: string) => void;
}) {
  const sel = useMemo(() => new Set(selected.map((x) => x.toUpperCase())), [selected]);

  const [chartWatch, setChartWatch] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setChartWatch(getChartWatch());
    sync();

    window.addEventListener("cryptolink:chartwatch" as any, sync);
    return () => window.removeEventListener("cryptolink:chartwatch" as any, sync);
  }, []);

  const onToggleChart = (symbol: string) => {
    const next = toggleChartWatch(symbol);
    setChartWatch(next);
    window.dispatchEvent(new Event("cryptolink:chartwatch"));
  };

  return (
    <div className="flex flex-wrap gap-2.5">
      {symbols.map((s) => {
        const key = s.toUpperCase();
        const active = sel.has(key);

        const inChart = chartWatch.includes(key);
        const full = chartWatch.length >= 5 && !inChart;

        return (
          <div key={s} className="flex items-center gap-1.5">
            <button
              onClick={() => onToggle(s)}
              className={[
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-[0.01em] transition-all duration-200",
                "backdrop-blur-sm",
                active
                  ? "border-amber-300/25 bg-gradient-to-b from-amber-300/15 to-amber-200/5 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.06),0_10px_24px_rgba(0,0,0,0.18)]"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-amber-200/18 hover:bg-amber-200/[0.06] hover:text-white",
              ].join(" ")}
              aria-pressed={active}
              title={active ? "Selected" : "Select"}
            >
              <span className="inline-flex items-center gap-1.5">
                {active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.65)]" />
                ) : null}
                {s}
              </span>
            </button>

            <button
              onClick={() => onToggleChart(s)}
              disabled={full}
              className={[
                "rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200",
                "backdrop-blur-sm",
                full
                  ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25"
                  : inChart
                  ? "border-emerald-300/25 bg-gradient-to-b from-emerald-300/15 to-emerald-200/5 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.05),0_8px_20px_rgba(0,0,0,0.16)]"
                  : "border-white/10 bg-white/[0.04] text-white/60 hover:border-emerald-200/18 hover:bg-emerald-200/[0.06] hover:text-white",
              ].join(" ")}
              title={full ? "Max 5 pinned to chart" : inChart ? "Remove from chart" : "Pin to chart"}
              aria-pressed={inChart}
            >
              {inChart ? "✓" : "📈"}
            </button>
          </div>
        );
      })}
    </div>
  );
}