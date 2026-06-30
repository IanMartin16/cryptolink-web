"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { AttentionRow } from "@/lib/useMarketAttention";

/**
 * AttentionPulsePanel (antes TrendChartPanel / "Trend Pulse").
 *
 * Renombrado por honestidad: su fuente ahora es Market Attention (attentionScore),
 * no los trends de crypto. Grafica el PULSO DE ATENCIÓN del mercado en el tiempo
 * (composite del attentionScore de los leaders), no un "trend score".
 *
 * El composite y el sample siguen igual; solo cambió el campo leído
 * (score -> attentionScore) y el tono/umbral, ya que attentionScore es 0..100
 * (no -N..+N como el trend score viejo).
 */

export default function AttentionPulsePanel({
  items,
  maxPoints = 40,
}: {
  items: AttentionRow[];
  maxPoints?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const trendPulseHistory = useMarketSignalsStore((s) => s.trendPulseHistory);
  const appendTrendPulsePoint = useMarketSignalsStore((s) => s.appendTrendPulsePoint);
  const lastTimeRef = useRef<UTCTimestamp | 0>(0);

  // composite del attentionScore (0..100) de los leaders
  const compositeScore = useMemo(() => {
    if (!items?.length) return 0;
    const valid = items.filter((x) => typeof x.attentionScore === "number");
    if (!valid.length) return 0;
    return valid.reduce((acc, x) => acc + x.attentionScore, 0) / valid.length;
  }, [items]);

  const trackedAssets = useMemo(() => items?.length ?? 0, [items]);

  // umbrales acordes a 0..100: >55 alta atención, <35 baja
  const tone =
    compositeScore >= 55
      ? "HIGH"
      : compositeScore <= 35
      ? "LOW"
      : "NEUTRAL";

  const lineColor =
    tone === "HIGH" ? "#34d399" : tone === "LOW" ? "#fb7185" : "#f59e0b";

  const areaTop =
    tone === "HIGH"
      ? "rgba(52,211,153,0.28)"
      : tone === "LOW"
      ? "rgba(251,113,133,0.28)"
      : "rgba(245,158,11,0.24)";
  const areaBottom =
    tone === "HIGH"
      ? "rgba(52,211,153,0.02)"
      : tone === "LOW"
      ? "rgba(251,113,133,0.02)"
      : "rgba(245,158,11,0.02)";

  const panelGlow =
    tone === "HIGH"
      ? "inset 0 0 44px rgba(52,211,153,0.10), 0 8px 30px rgba(0,0,0,0.25)"
      : tone === "LOW"
      ? "inset 0 0 44px rgba(251,113,133,0.10), 0 8px 30px rgba(0,0,0,0.25)"
      : "inset 0 0 44px rgba(245,158,11,0.08), 0 8px 30px rgba(0,0,0,0.25)";

  const toneCls =
    tone === "HIGH"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : tone === "LOW"
      ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
      : "border-white/15 bg-white/5 text-white/70";

  // 1) init chart
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
      timeScale: { borderVisible: false, secondsVisible: true, timeVisible: true },
      crosshair: { vertLine: { visible: true }, horzLine: { visible: true } },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addSeries(AreaSeries, {
      lineWidth: 2,
      lineColor,
      topColor: areaTop,
      bottomColor: areaBottom,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;
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
      seriesRef.current = null;
    };
  }, []);

  // 2) colores según tono
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.applyOptions({ lineColor, topColor: areaTop, bottomColor: areaBottom });
  }, [lineColor, areaTop, areaBottom]);

  // 3) muestreo uniforme
  const compositeRef = useRef(compositeScore);
  useEffect(() => {
    compositeRef.current = compositeScore;
  }, [compositeScore]);

  useEffect(() => {
    if (!items?.length) return;
    const SAMPLE_MS = 10_000;
    const sample = () => {
      const nowSec = Math.floor(Date.now() / 1000) as UTCTimestamp;
      if (nowSec === lastTimeRef.current) return;
      lastTimeRef.current = nowSec;
      appendTrendPulsePoint({ time: nowSec, value: compositeRef.current }, maxPoints);
    };
    sample();
    const id = setInterval(sample, SAMPLE_MS);
    return () => clearInterval(id);
  }, [items?.length, maxPoints, appendTrendPulsePoint]);

  // 4) render desde el histórico
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
          {trackedAssets} assets · {maxPoints} pts
        </div>
      </div>
      <div ref={containerRef} className="relative" />
    </div>
  );
}
