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
import type { TrendItem } from "@/lib/types";

type Point = { time: UTCTimestamp; value: number };

export default function TrendChartPanel({
  items,
  maxPoints = 40,
}: {
  items: TrendItem[];
  maxPoints?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

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

  // degradado del área bajo la línea (premium): mismo tono, desvaneciendo
  const areaTop =
    tone === "BULLISH"
      ? "rgba(52,211,153,0.28)"
      : tone === "BEARISH"
      ? "rgba(251,113,133,0.28)"
      : "rgba(245,158,11,0.24)";
  const areaBottom =
    tone === "BULLISH"
      ? "rgba(52,211,153,0.02)"
      : tone === "BEARISH"
      ? "rgba(251,113,133,0.02)"
      : "rgba(245,158,11,0.02)";

  // glow del contenedor según tono (aura premium sin tocar el canvas)
  const panelGlow =
    tone === "BULLISH"
      ? "inset 0 0 44px rgba(52,211,153,0.10), 0 8px 30px rgba(0,0,0,0.25)"
      : tone === "BEARISH"
      ? "inset 0 0 44px rgba(251,113,133,0.10), 0 8px 30px rgba(0,0,0,0.25)"
      : "inset 0 0 44px rgba(245,158,11,0.08), 0 8px 30px rgba(0,0,0,0.25)";

  const toneCls =
    tone === "BULLISH"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : tone === "BEARISH"
      ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
      : "border-white/15 bg-white/5 text-white/70";

  // 1) init chart (AreaSeries para el look premium con degradado)
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
      rightPriceScale: { borderVisible: false },
      leftPriceScale: { visible: false },
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

  // 2) actualizar colores del área/linea cuando cambia el tono
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.applyOptions({
      lineColor,
      topColor: areaTop,
      bottomColor: areaBottom,
    });
  }, [lineColor, areaTop, areaBottom]);

  // 3) MUESTREO UNIFORME: un punto cada N segundos EXACTOS,
  //    desacoplado de cuándo llegan los datos (arregla el eje irregular).
  const compositeRef = useRef(compositeScore);
  useEffect(() => {
    compositeRef.current = compositeScore;
  }, [compositeScore]);

  useEffect(() => {
    if (!items?.length) return;

    const SAMPLE_MS = 10_000; // intervalo fijo de muestreo

    const sample = () => {
      const nowSec = Math.floor(Date.now() / 1000) as UTCTimestamp;
      if (nowSec === lastTimeRef.current) return;
      lastTimeRef.current = nowSec;
      appendTrendPulsePoint({ time: nowSec, value: compositeRef.current }, maxPoints);
    };

    sample(); // primer punto inmediato al montar / al haber datos
    const id = setInterval(sample, SAMPLE_MS);

    return () => clearInterval(id);
    // depende de items?.length (no del objeto items) para no recrear el intervalo
    // en cada refresh; el valor más reciente se lee de compositeRef.
  }, [items?.length, maxPoints, appendTrendPulsePoint]);

  // 4) render de la serie desde el histórico del store
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
