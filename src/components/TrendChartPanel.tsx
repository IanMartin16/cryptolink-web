"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import {
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { TrendItem } from "@/lib/types";

type Point = { time: UTCTimestamp; value: number};

export default function TrendChartPanel({
  items,
  maxPoints = 40,
}: {
  items: TrendItem[];
  maxPoints?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // histórico del composite
  const trendPulseHistory = useMarketSignalsStore((s) => s.trendPulseHistory);
  const appendTrendPulsePoint = useMarketSignalsStore((s) => s.appendTrendPulsePoint);
  const lastTimeRef = useRef<UTCTimestamp | 0>(0);

  const compositeScore = useMemo(() => {
    if (!items?.length) return 0;
    const valid = items.filter((x) => typeof x.score === "number");
    if (!valid.length) return 0;
    return valid.reduce((acc, x) => acc + x.score, 0) / valid.length;
  }, [items]);

  const trackedAssets = useMemo(() => items?.length ?? 0, [items]);

  const tone =
    compositeScore >= 1.0
      ? "BULLISH"
      : compositeScore <= -1.0
      ? "BEARISH"
      : "NEUTRAL";

  const lineColor =
    tone === "BULLISH"
      ? "#34d399"
      : tone === "BEARISH"
      ? "#fb7185"
      : "#f59e0b";

  const toneCls =
    tone === "BULLISH"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : tone === "BEARISH"
      ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
      : "border-white/15 bg-white/5 text-white/70";

  // 1) init chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 220,
      layout: {
        background: { color: "transparent" },
        textColor: "#b7b7b7",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        secondsVisible: true,
        timeVisible: true,
      },
      crosshair: {
        vertLine: { visible: true },
        horzLine: { visible: true },
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addSeries(LineSeries, {
      lineWidth: 2,
      color: lineColor,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    chart.applyOptions({ width: containerRef.current.clientWidth });

    const onResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // 2) actualizar color del composite
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.applyOptions({ color: lineColor });
  }, [lineColor]);

  // 3) agregar punto nuevo del composite
  useEffect(() => {
    if (!seriesRef.current) return;
    if (!items?.length) return;

    const nowSec = Math.floor(Date.now() / 1000) as UTCTimestamp;

    if (nowSec === lastTimeRef.current) return;
    lastTimeRef.current = nowSec;

    const next: Point = {
      time: nowSec,
      value: compositeScore,
    };

    appendTrendPulsePoint(next, maxPoints);

    
  }, [items, compositeScore, maxPoints]);  

  useEffect(() => {
  if (!seriesRef.current) return;
  if (!trendPulseHistory?.length) {
    seriesRef.current.setData([]);
    return;
  }

  const data = trendPulseHistory.map((p) => ({
    time: p.time as UTCTimestamp,
    value: p.value,
  }));

  seriesRef.current.setData(data);
  chartRef.current?.timeScale().fitContent();
}, [trendPulseHistory]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white/70">
            <span>Trend Pulse</span>

            <span
              className={[
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors",
                toneCls,
              ].join(" ")}
            >
              {tone}
            </span>
          </div>

          <div className="text-[11px] text-white/45">
            Composite trend score · {compositeScore.toFixed(2)}
          </div>
        </div>

        <div className="text-[11px] text-white/45">
          {trackedAssets} assets · {maxPoints} pts
        </div>
      </div>

      <div ref={containerRef} className="relative" />
    </div>
  );
}