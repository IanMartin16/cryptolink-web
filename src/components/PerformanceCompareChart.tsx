"use client";

/**
 * PerformanceCompareChart — reemplaza a MomentumLeaderChart.
 *
 * Chart "compare" estilo TradingView con lightweight-charts: líneas de precio
 * REBASEADAS a 100, que cargan LLENAS desde historical_prices (no acumulan en
 * cliente → ya no se resetea en reload). El líder va más grueso; todas muestran
 * su valor en el borde derecho (value flag).
 *
 * Requiere:  npm i lightweight-charts@^5   (API v5: addSeries(LineSeries, …))
 */

import { useEffect, useRef, useState } from "react";
import { createChart, LineSeries, ColorType, LineStyle, type UTCTimestamp } from "lightweight-charts";

type Pt = { t: number; v: number };
type Serie = { symbol: string; last: number; direction: "up" | "down" | "flat"; points: Pt[] };

// colores distintos y saturados (como la demo de TradingView)
const PALETTE = ["#4FD1FF", "#2EE59D", "#B388FF", "#FFD166", "#FF8FB1", "#7CF5C9", "#FFA94D", "#9BE15D"];

export default function PerformanceCompareChart({
  symbols,
  leader,
  window = "7d",
  height = 240,
}: {
  symbols: string[];
  leader?: string;
  window?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [series, setSeries] = useState<Serie[]>([]);
  const [err, setErr] = useState("");

  // fetch de la serie rebaseada para el top-N
  useEffect(() => {
    if (!symbols.length) return;
    let cancelled = false;
    (async () => {
      try {
        setErr("");
        const qs = encodeURIComponent(symbols.join(","));
        const res = await fetch(`/api/cryptolink/compare?symbols=${qs}&window=${window}`, {
          headers: { accept: "application/json" },
        });
        const json = await res.json();
        if (!cancelled) {
          if (json?.ok) setSeries(json.series ?? []);
          else setErr(json?.error ?? "unknown");
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbols.join(","), window]);

  // crear/destruir el chart cuando cambia la data (lightweight-charts es canvas,
  // necesita manejo manual de ciclo de vida en React)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !series.length) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" },
        textColor: "rgba(255,255,255,0.55)",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.10)" },
      timeScale: { borderColor: "rgba(255,255,255,0.10)", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
      handleScroll: false,
      handleScale: false,
    });

    series.forEach((s, i) => {
      const isLeader = s.symbol === leader;
      const color = isLeader ? "#FFFFFF" : PALETTE[i % PALETTE.length];
      const line = chart.addSeries(LineSeries, {
        color,
        lineWidth: isLeader ? 3 : 2,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: true, // value flag a la derecha (como la imagen de TV)
        title: s.symbol,
        crosshairMarkerVisible: true,
      });
      line.setData(s.points.map((p) => ({ time: p.t as UTCTimestamp, value: p.v })));
    });

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [series, leader, height]);

  if (err)
    return (
      <div style={{ height, display: "grid", placeItems: "center", fontSize: 12, opacity: 0.5 }}>
        No se pudo cargar la comparación: {err}
      </div>
    );

  if (!series.length)
    return (
      <div style={{ height, display: "grid", placeItems: "center", fontSize: 12, opacity: 0.5 }}>
        Cargando comparación…
      </div>
    );

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
