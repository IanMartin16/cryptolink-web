"use client";
import { useEffect, useRef, useState } from "react";
import { createChart, BaselineSeries, ColorType, type UTCTimestamp } from "lightweight-charts";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";

type Pt = { t: number; value: number; label: string };
type VL = { value: number; label: string };
type FG = {
  ok: boolean; source: string; window: string;
  current: VL | null;
  comparisons: { yesterday: VL | null; lastWeek: VL | null; lastMonth: VL | null };
  extremes: { high: (VL & { t: number }) | null; low: (VL & { t: number }) | null };
  trackingSince: number | null;
  series: Pt[];
};

const ZONES: [number, number, string][] = [
  [0, 25, "#E23D3D"], [25, 45, "#E8833A"], [45, 55, "#E8C84A"], [55, 75, "#7FC241"], [75, 100, "#2EAE60"],
];
function bandColor(v: number) {
  for (const [lo, hi, c] of ZONES) if (v >= lo && v <= hi) return c;
  return "#E8C84A";
}
function fmtDate(t?: number) {
  if (!t) return "—";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(t * 1000));
}

// ---- Gauge SVG (semicírculo, aguja al valor actual) ----
const CX = 110, CY = 112, R = 88, SW = 18;
function pt(v: number): [number, number] {
  const th = Math.PI * (1 - v / 100);
  return [CX + R * Math.cos(th), CY - R * Math.sin(th)];
}
function arc(v1: number, v2: number) {
  const [x1, y1] = pt(v1), [x2, y2] = pt(v2);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
function Gauge({ value, label }: { value: number; label: string }) {
  const [nx, ny] = (() => { const th = Math.PI * (1 - value / 100); return [CX + R * 0.74 * Math.cos(th), CY - R * 0.74 * Math.sin(th)]; })();
  return (
    <svg viewBox="0 0 220 132" width="100%" style={{ maxWidth: 260 }}>
      {ZONES.map(([a, b, c]) => (
        <path key={a} d={arc(a, b)} stroke={c} strokeWidth={SW} fill="none" strokeLinecap="butt" opacity={0.9} />
      ))}
      <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      <circle cx={CX} cy={CY} r={6} fill="#fff" />
      <text x={CX} y={CY - 34} textAnchor="middle" fontSize={34} fontWeight={900} fill={bandColor(value)}>{value}</text>
      <text x={CX} y={CY - 14} textAnchor="middle" fontSize={13} fontWeight={700} fill="rgba(255,255,255,0.75)">{label}</text>
    </svg>
  );
}

function Row({ k, v }: { k: string; v: VL | null; sub?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 13, opacity: 0.65 }}>{k}</span>
      {v ? (
        <span style={{ fontSize: 13, fontWeight: 800, color: bandColor(v.value), fontVariantNumeric: "tabular-nums" }}>
          {v.label} · {v.value}
        </span>
      ) : <span style={{ opacity: 0.4 }}>—</span>}
    </div>
  );
}

const WINDOWS = ["30d", "1y", "all"] as const;

export default function FearGreedPanel() {
  const [win, setWin] = useState<(typeof WINDOWS)[number]>("30d");
  const [data, setData] = useState<FG | null>(null);
  const [err, setErr] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr("");
        const r = await fetch(`/api/social/fear-greed?window=${win}`, { headers: { accept: "application/json" } });
        const j = await r.json();
        if (!cancelled) { j?.ok ? setData(j) : setErr(j?.error ?? "unknown"); }
      } catch (e: any) { if (!cancelled) setErr(e?.message ?? "unknown"); }
    })();
    return () => { cancelled = true; };
  }, [win]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !data?.series?.length) return;
    const chart = createChart(el, {
      width: el.clientWidth, height: 220,
      layout: { background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" }, textColor: "rgba(255,255,255,0.55)", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.04)" }, horzLines: { color: "rgba(255,255,255,0.05)" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.10)", scaleMargins: { top: 0.06, bottom: 0.06 } },
      timeScale: { borderColor: "rgba(255,255,255,0.10)", timeVisible: false },
      crosshair: { mode: 1 }, handleScroll: false, handleScale: false,
    });
    const s = chart.addSeries(BaselineSeries, {
      baseValue: { type: "price", price: 50 },
      topLineColor: "#2EAE60", topFillColor1: "rgba(46,174,96,0.28)", topFillColor2: "rgba(46,174,96,0.04)",
      bottomLineColor: "#E23D3D", bottomFillColor1: "rgba(226,61,61,0.04)", bottomFillColor2: "rgba(226,61,61,0.28)",
      lineWidth: 2,
      autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
      priceFormat: { type: "price", precision: 0, minMove: 1 },   // → 11, y ticks en 0/25/50/75/100
    });
    s.setData(data.series.map((p) => ({ time: p.t as UTCTimestamp, value: p.value })));
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

  if (err) return <section style={section}><h2 style={{ margin: 0, fontSize: 22 }}>Fear &amp; <span style={{ color: UI.orange }}>Greed</span></h2><p style={{ marginTop: 8 }}>Cannot load: <b>{err}</b></p></section>;

  return (
    <section style={section}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Fear &amp; <span style={{ color: UI.orange }}>Greed</span></h2>
          <p style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>Market sentiment index · <span style={{ opacity: 0.7 }}>alternative.me</span></p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", height: "fit-content" }}>
          {WINDOWS.map((w) => (
            <button key={w} onClick={() => setWin(w)} style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: `1px solid ${w === win ? UI.orange : UI.border}`,
              background: w === win ? "rgba(255,159,67,0.12)" : "rgba(255,255,255,0.04)",
              color: w === win ? UI.orange : "rgba(255,255,255,0.7)",
            }}>{w === "30d" ? "30D" : w === "1y" ? "1Y" : "All"}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1.2fr)", gap: 18, marginTop: 14, alignItems: "center" }}>
        {/* GAUGE + HISTÓRICO */}
        <div>
          {data?.current ? <Gauge value={data.current.value} label={data.current.label} /> : <div style={{ height: 132 }} />}
          <div style={{ marginTop: 8 }}>
            <Row k="Yesterday" v={data?.comparisons.yesterday ?? null} />
            <Row k="Last week" v={data?.comparisons.lastWeek ?? null} />
            <Row k="Last month" v={data?.comparisons.lastMonth ?? null} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <span style={{ fontSize: 13, opacity: 0.65 }}>Yearly high <span style={{ opacity: 0.5 }}>({fmtDate(data?.extremes.high?.t)})</span></span>
              <span style={{ fontSize: 13, fontWeight: 800, color: data?.extremes.high ? bandColor(data.extremes.high.value) : "#888" }}>
                {data?.extremes.high ? `${data.extremes.high.label} · ${data.extremes.high.value}` : "—"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <span style={{ fontSize: 13, opacity: 0.65 }}>Yearly low <span style={{ opacity: 0.5 }}>({fmtDate(data?.extremes.low?.t)})</span></span>
              <span style={{ fontSize: 13, fontWeight: 800, color: data?.extremes.low ? bandColor(data.extremes.low.value) : "#888" }}>
                {data?.extremes.low ? `${data.extremes.low.label} · ${data.extremes.low.value}` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* CHART */}
        <div>
          <div ref={containerRef} style={{ width: "100%", height: 220 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, fontSize: 11, opacity: 0.45 }}>
            <DataStatusBadge status="live" />
          </div>
        </div>
      </div>
    </section>
  );
}