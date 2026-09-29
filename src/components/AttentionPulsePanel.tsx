"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { PulsePoint } from "@/lib/useMarketAttention";   // el tipo {day, composite}

export default function AttentionPulsePanel({
  series,
}: {
  series: PulsePoint[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaRef = useRef<ISeriesApi<"Area"> | null>(null);   // ← la serie del chart (no choca con la prop `series`)

  // ---- cálculos derivados (ANTES de usarlos) ----
  const compositeScore = series.length ? series[series.length - 1].composite : 0;
  const trackedAssets = series.length;

  const tone =
    compositeScore >= 55 ? "HIGH" : compositeScore <= 35 ? "LOW" : "NEUTRAL";

  const lineColor =
    tone === "HIGH" ? "#34d399" : tone === "LOW" ? "#fb7185" : "#f59e0b";
  const areaTop =
    tone === "HIGH" ? "rgba(52,211,153,0.28)"
    : tone === "LOW" ? "rgba(251,113,133,0.28)"
    : "rgba(245,158,11,0.24)";
  const areaBottom =
    tone === "HIGH" ? "rgba(52,211,153,0.02)"
    : tone === "LOW" ? "rgba(251,113,133,0.02)"
    : "rgba(245,158,11,0.02)";
  const panelGlow =
    tone === "HIGH" ? "inset 0 0 44px rgba(52,211,153,0.10), 0 8px 30px rgba(0,0,0,0.25)"
    : tone === "LOW" ? "inset 0 0 44px rgba(251,113,133,0.10), 0 8px 30px rgba(0,0,0,0.25)"
    : "inset 0 0 44px rgba(245,158,11,0.08), 0 8px 30px rgba(0,0,0,0.25)";
  const toneCls =
    tone === "HIGH" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
    : tone === "LOW" ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
    : "border-white/15 bg-white/5 text-white/70";

  // ---- 1) init del chart (una sola vez) ----
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 220,
      layout: { background: { color: "transparent" }, textColor: "#b7b7b7" },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: { borderVisible: false },
      leftPriceScale: { visible: false },
      // eje por DÍA ahora (no horas): sin segundos ni hora
      timeScale: { borderVisible: false, secondsVisible: false, timeVisible: false },
      crosshair: { vertLine: { visible: true }, horzLine: { visible: true } },
      handleScroll: true,
      handleScale: true,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineWidth: 2,
      lineColor,
      topColor: areaTop,
      bottomColor: areaBottom,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
    });

    chartRef.current = chart;
    areaRef.current = areaSeries;
    chart.applyOptions({ width: containerRef.current.clientWidth });

    const onResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartRef.current = null;
      areaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 2) colores según el tono ----
  useEffect(() => {
    if (!areaRef.current) return;
    areaRef.current.applyOptions({ lineColor, topColor: areaTop, bottomColor: areaBottom });
  }, [lineColor, areaTop, areaBottom]);

  // ---- 3) render de la serie histórica (por día) ----
  useEffect(() => {
    if (!areaRef.current) return;
    if (!series.length) {
      areaRef.current.setData([]);
      return;
    }
    const data = series.map((p) => ({
      time: p.day as any,          // "2026-09-28" (business day string)
      value: p.composite,
    }));
    areaRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [series]);

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
      style={{ boxShadow: panelGlow, transition: "box-shadow 400ms ease" }}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white/70">
            <span>Attention Pulse</span>
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
            Composite attention · {compositeScore.toFixed(1)}
          </div>
        </div>
        <div className="text-[11px] text-white/45">
          {trackedAssets} days
        </div>
      </div>
      <div ref={containerRef} className="relative" />
    </div>
  );
}