"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import {
  AreaSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

import type { PriceRow } from "@/lib/types";
import { usePriceHistory, getPriceHistory } from "@/lib/usePriceHistory";

type ChartPoint = { t: number; price: number };

const POPULAR_COMPARE = ["ETH", "SOL", "BNB", "XRP", "ADA", "DOGE"];
const SERIES_COLORS = {
  main: "#60a5fa",
  ov1: "#34d399",
  ov2: "#f59e0b",
};

function buildPointsFromPrices(prices: number[], stepMs = 5000): ChartPoint[] {
  const now = Date.now();
  const start = now - Math.max(0, prices.length - 1) * stepMs;
  return prices.map((price, i) => ({ t: start + i * stepMs, price }));
}

function toSeries(points: ChartPoint[]) {
  return points.map((p) => ({
    time: Math.floor(p.t / 1000) as UTCTimestamp,
    value: p.price,
  }));
}

function normalizeTo100(prices: number[]) {
  const base = prices.find((x) => Number.isFinite(x) && x !== 0);
  if (!base) return prices;
  return prices.map((p) => (p / base) * 100);
}

function formatPrice(value: number, fiat: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: fiat,
      maximumFractionDigits: fiat === "JPY" ? 0 : value >= 1 ? 2 : 6,
    }).format(value);
  } catch {
    return `${fiat} ${value}`;
  }
}

function formatPct(pct: number) {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function computeRangeStats(values: number[]) {
  if (values.length < 2) return null;

  const first = values[0];
  const last = values[values.length - 1];
  const high = Math.max(...values);
  const low = Math.min(...values);

  const rangePct = first !== 0 ? ((last - first) / first) * 100 : 0;
  const volPct = last !== 0 ? ((high - low) / last) * 100 : 0;

  return { first, last, high, low, rangePct, volPct };
}

export default function PriceComparePanel({
  rows,
  symbol,
  onSymbolChange,
}: {
  rows: PriceRow[];
  symbol: string;
  onSymbolChange: (s: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainRef = useRef<ISeriesApi<"Area"> | null>(null);
  const overlayRef = useRef<{
    ov1: ISeriesApi<"Line"> | null;
    ov2: ISeriesApi<"Line"> | null;
  }>({ ov1: null, ov2: null });

  
  const [hover, setHover] = useState<{ price?: number; t?: number } | null>(null);
  const storedCompareSymbols = useMarketSignalsStore((s: any) => s.compareSymbols);
  const setStoredCompareSymbols = useMarketSignalsStore((s: any) => s.setCompareSymbols);

  const storedCompareRange = useMarketSignalsStore(
    (s: { compareRange: "5m" | "15m" | "50m" }) => s.compareRange
  );
  const setStoredCompareRange = useMarketSignalsStore((s: any) => s.setCompareRange);

  const storedCompareNormalize = useMarketSignalsStore((s: any) => s.compareNormalize);
  const setStoredCompareNormalize = useMarketSignalsStore((s: any) => s.setCompareNormalize);

  const storedMainSymbol = useMarketSignalsStore((s: any) => s.compareMainSymbol);
  const setStoredMainSymbol = useMarketSignalsStore((s: any) => s.setCompareMainSymbol);

  const range: "5m" | "15m" | "50m"= storedCompareRange ?? "15m";
  const normalize = storedCompareNormalize ?? true;
  const compare = storedCompareSymbols ?? [];

  const symbols = useMemo(() => {
    return [...new Set((rows || []).map((r) => r.symbol))].sort();
  }, [rows]);

  const currentRow = useMemo(() => rows.find((r) => r.symbol === symbol), [rows, symbol]);
  const fiat = currentRow?.fiat ?? "USD";
  const currentPrice = typeof currentRow?.price === "number" ? currentRow.price : undefined;

  const pointsByRange = {
    "5m": 60,
    "15m": 180,
    "50m": 600,
  };

  const maxPoints = pointsByRange[range];

  const mainPrices = usePriceHistory(symbol, currentPrice, 600);

  const mainValues = useMemo(() => {
    const sliced = mainPrices.slice(-maxPoints);
    return normalize ? normalizeTo100(sliced) : sliced;
  }, [mainPrices, maxPoints, normalize]);

  const mainPoints = useMemo(() => buildPointsFromPrices(mainValues, 5000), [mainValues]);
  const mainSeriesData = useMemo(() => toSeries(mainPoints), [mainPoints]);

  const compare1 = compare[0];
  const compare2 = compare[1];

  const overlay1Values = useMemo(() => {
    if (!compare1) return [];
    const raw = getPriceHistory(compare1).slice(-maxPoints);
    return normalize ? normalizeTo100(raw) : raw;
  }, [compare1, maxPoints, normalize, rows]);

  const overlay2Values = useMemo(() => {
    if (!compare2) return [];
    const raw = getPriceHistory(compare2).slice(-maxPoints);
    return normalize ? normalizeTo100(raw) : raw;
  }, [compare2, maxPoints, normalize, rows]);

  const overlay1Series = useMemo(
    () => toSeries(buildPointsFromPrices(overlay1Values, 5000)),
    [overlay1Values]
  );

  const overlay2Series = useMemo(
    () => toSeries(buildPointsFromPrices(overlay2Values, 5000)),
    [overlay2Values]
  );

  const rangeStats = useMemo(() => computeRangeStats(mainValues), [mainValues]);

  const shown = hover?.price ?? currentPrice;

  const deltaPct = useMemo(() => {
    if (typeof shown !== "number" || typeof currentPrice !== "number" || currentPrice === 0) return undefined;
    return ((shown - currentPrice) / currentPrice) * 100;
  }, [shown, currentPrice]);

  const deltaTone =
    typeof deltaPct === "number"
      ? deltaPct > 0
        ? "text-emerald-300"
        : deltaPct < 0
        ? "text-rose-300"
        : "text-white/70"
      : "text-white/45";

  const compareOptions = useMemo(
    () => symbols.filter((s) => s !== symbol && !compare.includes(s)),
    [symbols, symbol, compare]
  );

  function toggleCompare(sym: string) {
    const key = sym.toUpperCase();
    if (key === symbol.toUpperCase()) return;

    const next = compare.includes(key)
      ? compare.filter((x: string) => x !== key)
      : compare.length < 2
      ? [...compare, key]
      : [compare[0], key];

    setStoredCompareSymbols(next);
  }

  function removeCompare(sym: string) {
    setStoredCompareSymbols(compare.filter((x: string) => x !== sym));
  }

  useEffect(() => {
    setStoredCompareSymbols(
      compare.filter((s: string) => s !== symbol && symbols.includes(s)).slice(0, 2)
    );
  }, [symbol, symbols]);

  useEffect(() => {
    if (symbol) setStoredMainSymbol(symbol);
  }, [symbol, setStoredMainSymbol]);  

  useEffect(() => {
    if (
      storedMainSymbol &&
      storedMainSymbol !== symbol &&
      symbols.includes(storedMainSymbol)
    ) {
      onSymbolChange(storedMainSymbol);
    }
  }, [storedMainSymbol, symbol, symbols, onSymbolChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 320,
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(255,255,255,0.68)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.14)" },
        horzLine: { color: "rgba(255,255,255,0.14)" },
      },
      handleScroll: true,
      handleScale: true,
    });

    const main = chart.addSeries(AreaSeries, {
      lineWidth: 2,
      lineColor: SERIES_COLORS.main,
      topColor: "rgba(96,165,250,0.16)",
      bottomColor: "rgba(96,165,250,0.01)",
      priceLineVisible: true,
      lastValueVisible: true,
    });

    const ov1 = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: SERIES_COLORS.ov1,
      priceLineVisible: true,
      lastValueVisible: true,
    });

    const ov2 = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: SERIES_COLORS.ov2,
      priceLineVisible: true,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    mainRef.current = main;
    overlayRef.current = { ov1, ov2 };

    chart.subscribeCrosshairMove((p) => {
      const series = mainRef.current;
      if (!series) return;

      const v: any = p.seriesData.get(series);
      const price = typeof v?.value === "number" ? v.value : undefined;
      const t = p.time ? Number(p.time) * 1000 : undefined;
      setHover({ price, t });
    });

    const onResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    };

    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      setHover(null);
      chart.remove();
      chartRef.current = null;
      mainRef.current = null;
      overlayRef.current = { ov1: null, ov2: null };
    };
  }, []);

  useEffect(() => {
    if (!mainRef.current) return;
    mainRef.current.setData(mainSeriesData);
    chartRef.current?.timeScale().fitContent();
  }, [mainSeriesData]);

  useEffect(() => {
    if (!overlayRef.current.ov1 || !overlayRef.current.ov2) return;

    overlayRef.current.ov1.setData(compare1 ? overlay1Series : []);
    overlayRef.current.ov2.setData(compare2 ? overlay2Series : []);
  }, [compare1, compare2, overlay1Series, overlay2Series]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_16px_50px_rgba(0,0,0,0.22)] overflow-hidden">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-white/90">Compare</div>
            <div className="mt-1 text-sm text-white/55">
              Compare how selected assets performed over the choosen time window
            </div>

            <div className="mt-2 text-xs text-white/45 tabular-nums">
              {typeof shown === "number"
                ? normalize
                  ? `@ ${shown.toFixed(2)}`
                  : `@ ${formatPrice(shown, fiat)}`
                : "warming…"}
              {hover?.t ? ` • ${new Date(hover.t).toLocaleTimeString()}` : ""}
              {typeof deltaPct === "number" ? (
                <span className={`ml-2 font-semibold ${deltaTone}`}>{formatPct(deltaPct)}</span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
              <input
                type="checkbox"
                checked={normalize}
                onChange={(e) => setStoredCompareNormalize(e.target.checked)}
              />
              Normalize
            </label>
              <span className="text-[11px] text-white/45">Base 100 comparison</span>
            <div className="flex gap-1">
              {(["5m", "15m", "50m"] as const).map((r) => {
                const active = range === r;
                return (
                  <button
                    key={r}
                    onClick={() => setStoredCompareRange(r)}
                    className={[
                      "rounded-lg border px-3 py-1 text-xs font-semibold transition",
                      active
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            <select
              value={symbol}
              onChange={(e) => onSymbolChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80 outline-none"
            >
              {symbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/45">Quick compare:</span>

          {POPULAR_COMPARE.filter((s) => s !== symbol).map((s) => {
            const active = compare.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleCompare(s)}
                className={[
                  "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {active ? `✓ ${s}` : `+${s}`}
              </button>
            );
          })}

          <select
            value=""
            onChange={(e) => {
              if (e.target.value) toggleCompare(e.target.value);
            }}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80 outline-none"
          >
            <option value="">+ add compare</option>
            {compareOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {compare.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {compare.map((s: string, i: number) => {
              const color = i === 0 ? SERIES_COLORS.ov1 : SERIES_COLORS.ov2;
              return (
                <button
                  key={s}
                  onClick={() => removeCompare(s)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/80"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: color }}
                  />
                  {s}
                  <span className="text-white/45">✕</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="px-3 py-3">
        <div className="mb-3 flex flex-wrap items-center gap-4 px-1 text-xs text-white/55">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLORS.main }} />
            <span>{symbol}</span>
          </div>

          {compare1 ? (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLORS.ov1 }} />
              <span>{compare1}</span>
            </div>
          ) : null}

          {compare2 ? (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLORS.ov2 }} />
              <span>{compare2}</span>
            </div>
          ) : null}
        </div>

        <div ref={containerRef} className="relative h-[320px]" />
      </div>

      {rangeStats ? (
        <div className="grid grid-cols-2 gap-2 border-t border-white/10 px-4 py-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <div className="text-[10px] text-white/45">High</div>
            <div className="mt-1 text-sm font-semibold text-white/85 tabular-nums">
              {normalize ? rangeStats.high.toFixed(2) : formatPrice(rangeStats.high, fiat)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <div className="text-[10px] text-white/45">Low</div>
            <div className="mt-1 text-sm font-semibold text-white/85 tabular-nums">
              {normalize ? rangeStats.low.toFixed(2) : formatPrice(rangeStats.low, fiat)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <div className="text-[10px] text-white/45">Range</div>
            <div
              className={[
                "mt-1 text-sm font-semibold tabular-nums",
                rangeStats.rangePct > 0
                  ? "text-emerald-300"
                  : rangeStats.rangePct < 0
                  ? "text-rose-300"
                  : "text-white/75",
              ].join(" ")}
            >
              {formatPct(rangeStats.rangePct)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <div className="text-[10px] text-white/45">Volatility</div>
            <div className="mt-1 text-sm font-semibold text-white/85 tabular-nums">
              {rangeStats.volPct.toFixed(2)}%
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}