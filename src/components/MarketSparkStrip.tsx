"use client";

import type { PriceRow } from "@/lib/types";
import { getPriceHistory } from "@/lib/usePriceHistory";
import { UI } from "@/lib/ui";

function clsPct(p?: number) {
  if (typeof p !== "number") return "text-white/55";
  return p > 0 ? "text-emerald-300" : p < 0 ? "text-rose-300" : "text-white/70";
}

function sparkPath(values: number[], w = 90, h = 28) {
  if (!values || values.length < 2) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const step = w / (values.length - 1);

  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function strokeFor(p?: number) {
  if (typeof p !== "number") return "rgba(255,255,255,0.40)";
  if (p > 0) return "rgba(46,229,157,0.85)";
  if (p < 0) return "rgba(255,107,107,0.85)";
  return "rgba(255,255,255,0.55)";
}

function ensureSparkData(hist: number[], current?: number, prev?: number) {
  const clean = (hist || []).filter((v) => typeof v === "number" && Number.isFinite(v));

  if (clean.length >= 2) return clean;

  const a = typeof prev === "number" ? prev : current;
  const b = typeof current === "number" ? current : prev;

  if (typeof a === "number" && typeof b === "number") return [a, b];
  if (typeof current === "number") return [current, current];

  return [];
}

export default function MarketSparkStrip({
  rows,
  max = 12,
  title = "MARKET PULSE BAR"
}: {
  rows: PriceRow[];
  max?: number;
  title?: string;
}) {
  const items = (rows || [])
    .map((r) => ({
      row: r,
      hist: getPriceHistory(r.symbol),
    }))
    .sort((a, b) => (b.hist?.length ?? 0) - (a.hist?.length ?? 0))
    .slice(0, max);

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold tracking-wide text-white/70">
          {title}
        </div>
        <div className="text-[11px] text-white/45">
          {items.length ? `${items.length} shown` : "—"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ row: r, hist }) => {
          const sparkValues = ensureSparkData(hist.slice(-30), r.price, r.prevPrice);
          const path = sparkPath(sparkValues, 90, 28);

          const last =
            sparkValues.length > 0 ? sparkValues[sparkValues.length - 1] : r.price;

          const first =
            sparkValues.length > 0 ? sparkValues[0] : r.prevPrice;

          const pct =
            typeof last === "number" &&
            typeof first === "number" &&
            first !== 0
              ? ((last - first) / first) * 100
              : r.pct;

          const stroke = strokeFor(pct);

          return (
            <div
              key={r.symbol}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white/80">
                  {r.symbol}
                  <span className="ml-2 text-[11px] text-white/45">
                    {r.fiat ?? ""}
                  </span>
                </div>

                <div className={`text-[11px] font-semibold tabular-nums ${clsPct(pct)}`}>
                  {typeof pct === "number"
                    ? `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`
                    : "—"}
                </div>
              </div>

              <div className="ml-3 shrink-0">
                <svg width="90" height="28" viewBox="0 0 90 28">
                  <defs>
                    <filter id={`glow-${r.symbol}`}>
                      <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <path
                    d={path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="1.8"
                    filter={typeof pct === "number" ? `url(#glow-${r.symbol})` : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}

        {!items.length ? (
          <div className="text-sm text-white/50">Waiting for prices…</div>
        ) : null}
      </div>
    </section>
  );
}