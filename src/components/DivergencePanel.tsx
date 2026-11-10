"use client";

/**
 * DivergencePanel — precio vs breadth (hermano de breadth, va en Derived Intelligence).
 *
 * Dos líneas superpauestas en DOS escalas (lightweight-charts v5): índice de precio
 * equal-weight (der) y breadth % (izq). Cuando se abren = divergencia. La línea de
 * breadth usa la MISMA definición que el panel Market Breadth en vivo (su último
 * punto debe coincidir con el número de ese panel — validación de consistencia).
 *
 * Requiere: npm i lightweight-charts@^5 (ya instalado para el compare de momentum).
 */

import { useEffect, useRef, useState } from "react";
import { createChart, LineSeries, ColorType, LineStyle, type UTCTimestamp } from "lightweight-charts";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";

type Pt = { t: number; v: number };
type Divergence = {
  ok: boolean;
  ts?: string;
  window?: string;
  state: "bearish-divergence" | "bullish-divergence" | "aligned-up" | "aligned-down" | "flat";
  priceChangePct: number;
  breadthChangePts: number;
  recentHours: number;
  latestIndex: number;
  latestBreadth: number;
  priceIndex: Pt[];
  breadth: Pt[];
};

const IDX_COLOR = "#4FD1FF";   // índice de precio (cian)
const BR_COLOR = "#FFB347";    // breadth (ámbar)

function stateMeta(state: string): { label: string; tone: string; note: string } {
  switch (state) {
    case "bearish-divergence":
      return { label: "Bearish divergence", tone: "#FF6B6B",
        note: "Price is rising but breadth is falling — the rally is narrowing." };
    case "bullish-divergence":
      return { label: "Bullish divergence", tone: "#2BFF88",
        note: "Price is falling but breadth is improving — the selloff is losing steam." };
    case "aligned-up":
      return { label: "Aligned · up", tone: "#2BFF88",
        note: "Price and breadth are rising together — broad confirmation." };
    case "aligned-down":
      return { label: "Aligned · down", tone: "#FF6B6B",
        note: "Price and breadth are falling together — broad weakness, no hidden support." };
    default:
      return { label: "Flat", tone: "rgba(255,255,255,0.8)",
        note: "No meaningful trend in either price or breadth right now." };
  }
}

function fmtTs(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
}
function signed(n: number, suffix = "") {
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(1)}${suffix}`;
}

export default function DivergencePanel({ window = "7d" }: { window?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Divergence | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");

  // fetch
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError("");
        const res = await fetch(`/api/cryptolink/divergence?window=${window}`, {
          headers: { accept: "application/json" },
        });
        const json = await res.json();
        if (!cancelled) {
          if (json?.ok) { setData(json); setStatus("live"); }
          else setError(json?.error ?? "unknown");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "unknown");
      }
    }
    load();
    const id = setInterval(load, 60000); // breadth/índice cambian lento
    return () => { cancelled = true; clearInterval(id); };
  }, [window]);

  // render chart (dos escalas)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !data || !data.priceIndex?.length) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 260,
      layout: { background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" }, textColor: "rgba(255,255,255,0.55)", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.05)" }, horzLines: { color: "rgba(255,255,255,0.05)" } },
      rightPriceScale: { visible: true, borderColor: "rgba(255,255,255,0.10)" },
      leftPriceScale: { visible: true, borderColor: "rgba(255,255,255,0.10)" },
      timeScale: { borderColor: "rgba(255,255,255,0.10)", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
      handleScroll: false, handleScale: false,
    });

    const idxSeries = chart.addSeries(LineSeries, {
      color: IDX_COLOR, lineWidth: 2, priceScaleId: "right",
      title: "Price index", lastValueVisible: true, priceLineVisible: false, lineStyle: LineStyle.Solid,
    });
    idxSeries.setData(data.priceIndex.map((p) => ({ time: p.t as UTCTimestamp, value: p.v })));

    const brSeries = chart.addSeries(LineSeries, {
      color: BR_COLOR, lineWidth: 2, priceScaleId: "left",
      title: "Breadth %", lastValueVisible: true, priceLineVisible: false, lineStyle: LineStyle.Solid,
    });
    brSeries.setData(data.breadth.map((p) => ({ time: p.t as UTCTimestamp, value: p.v })));

    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
    ro.observe(el);
    return () => { ro.disconnect(); chart.remove(); };
  }, [data]);

  const section: React.CSSProperties = {
    marginTop: UI.gap, padding: 18, border: `1px solid ${UI.border}`, borderRadius: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    boxShadow: "0 16px 50px rgba(0,0,0,0.22)", minWidth: 0, overflow: "hidden",
  };

  if (error) {
    return (
      <section style={section}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Price / Breadth <span style={{ color: UI.orange }}>Divergence</span></h2>
        <p style={{ marginTop: 8 }}>Cannot load divergence: <b>{error}</b></p>
      </section>
    );
  }

  const meta = data ? stateMeta(data.state) : null;

  return (
    <section style={section}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Price / Breadth <span style={{ color: UI.orange }}>Divergence</span></h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            When the market's price and its participation disagree.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DataStatusBadge status={status} />
          <div style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${UI.border}`, background: "rgba(255,255,255,0.05)", fontSize: 12, opacity: 0.82, whiteSpace: "nowrap" }}>
            {data?.window ?? "—"} · Updated <code>{fmtTs(data?.ts)}</code>
          </div>
        </div>
      </div>

      {/* READOUT */}
      {meta && data && (
        <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: meta.tone, lineHeight: 1 }}>{meta.label}</span>
          <span style={{ fontSize: 13, opacity: 0.8, fontVariantNumeric: "tabular-nums" }}>
            last {data.recentHours}h: price <b style={{ color: IDX_COLOR }}>{signed(data.priceChangePct, "%")}</b>
            {" · "}breadth <b style={{ color: BR_COLOR }}>{signed(data.breadthChangePts, " pts")}</b>
          </span>
        </div>
      )}
      {meta && <p style={{ marginTop: 6, fontSize: 13, opacity: 0.7, lineHeight: 1.4 }}>{meta.note}</p>}

      {/* CHART dos escalas */}
      <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center", fontSize: 11, opacity: 0.7 }}>
        <span><span style={{ color: IDX_COLOR }}>■</span> Price index (rebased 100)</span>
        <span><span style={{ color: BR_COLOR }}>■</span> Breadth % above MA</span>
      </div>
      {!data ? (
        <div style={{ height: 260, display: "grid", placeItems: "center", fontSize: 12, opacity: 0.5 }}>Loading…</div>
      ) : (
        <div ref={containerRef} style={{ width: "100%", height: 260, marginTop: 8 }} />
      )}
    </section>
  );
}
