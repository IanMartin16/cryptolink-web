"use client";

/**
 * MarketStructurePanel — reemplaza a Social Pulse Board en Derived Intelligence.
 *
 * DOS medidas honestas en un panel (asset_snapshot, top100 de /coins/markets):
 *   - Dominancia (BTC/ETH como % del mcap del top100 rastreado) sobre el tiempo.
 *   - Distancia al ATH (promedio de ath_change_pct = posicionamiento vs máximos).
 * Todo MEDIDO, nada aseverado. Chart de dos escalas (lightweight-charts v5):
 *   dominancia BTC (izq) + distancia al ATH (der).
 */

import { useEffect, useRef, useState } from "react";
import { createChart, LineSeries, ColorType, LineStyle, type UTCTimestamp } from "lightweight-charts";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";

type DomPt = { t: number; btc: number; eth: number };
type AthPt = { t: number; avg: number; nearAth: number; n: number };
type Structure = {
  ok: boolean;
  ts?: string;
  window?: string;
  btcDominance: number | null;
  ethDominance: number | null;
  avgAthDistance: number | null;
  nearAth: number | null;
  universe: number | null;
  dominance: DomPt[];
  ath: AthPt[];
  note?: string;
};

const BTC_COLOR = "#F7931A";   // naranja BTC (dominancia)
const ATH_COLOR = "#B388FF";   // violeta (distancia al ATH)

function fmtTs(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 14, border: `1px solid ${UI.border}`, background: "rgba(255,255,255,0.03)", minWidth: 0 }}>
      <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: tone ?? "rgba(255,255,255,0.92)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.55 }}>{label}</div>
    </div>
  );
}

export default function MarketStructurePanel({ window = "30d" }: { window?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Structure | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError("");
        const res = await fetch(`/api/social/market-structure?window=${window}`, { headers: { accept: "application/json" } });
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
    const id = setInterval(load, 300000); // horario → refresco tranquilo (5 min)
    return () => { cancelled = true; clearInterval(id); };
  }, [window]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !data || !data.dominance?.length) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 240,
      layout: { background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" }, textColor: "rgba(255,255,255,0.55)", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.05)" }, horzLines: { color: "rgba(255,255,255,0.05)" } },
      rightPriceScale: { visible: true, borderColor: "rgba(255,255,255,0.10)" },
      leftPriceScale: { visible: true, borderColor: "rgba(255,255,255,0.10)" },
      timeScale: { borderColor: "rgba(255,255,255,0.10)", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
      handleScroll: false, handleScale: false,
    });

    const domSeries = chart.addSeries(LineSeries, {
      color: BTC_COLOR, lineWidth: 2, priceScaleId: "left",
      title: "BTC dom %", lastValueVisible: true, priceLineVisible: false, lineStyle: LineStyle.Solid,
    });
    domSeries.setData(data.dominance.map((p) => ({ time: p.t as UTCTimestamp, value: p.btc })));

    if (data.ath?.length) {
      const athSeries = chart.addSeries(LineSeries, {
        color: ATH_COLOR, lineWidth: 2, priceScaleId: "right",
        title: "From ATH %", lastValueVisible: true, priceLineVisible: false, lineStyle: LineStyle.Solid,
      });
      athSeries.setData(data.ath.map((p) => ({ time: p.t as UTCTimestamp, value: p.avg })));
    }

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
        <h2 style={{ margin: 0, fontSize: 22 }}>Market <span style={{ color: UI.orange }}>Structure</span></h2>
        <p style={{ marginTop: 8 }}>Cannot load market structure: <b>{error}</b></p>
      </section>
    );
  }

  return (
    <section style={section}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Market <span style={{ color: UI.orange }}>Structure</span></h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Dominance and distance from all-time highs across the tracked top 100.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DataStatusBadge status={status} />
          <div style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${UI.border}`, background: "rgba(255,255,255,0.05)", fontSize: 12, opacity: 0.82, whiteSpace: "nowrap" }}>
            {data?.window ?? "—"} · Updated <code>{fmtTs(data?.ts)}</code>
          </div>
        </div>
      </div>

      {/* READOUTS */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <Stat label="BTC dominance" tone={BTC_COLOR} value={data?.btcDominance != null ? `${data.btcDominance}%` : "—"} />
        <Stat label="ETH dominance" value={data?.ethDominance != null ? `${data.ethDominance}%` : "—"} />
        <Stat label="Avg from ATH" tone={ATH_COLOR} value={data?.avgAthDistance != null ? `${data.avgAthDistance}%` : "—"} />
        <Stat label={`within 10% of ATH (of ${data?.universe ?? "—"})`} value={data?.nearAth != null ? `${data.nearAth}` : "—"} />
      </div>

      {/* CHART dos escalas */}
      <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center", fontSize: 11, opacity: 0.7 }}>
        <span><span style={{ color: BTC_COLOR }}>■</span> BTC dominance (left)</span>
        <span><span style={{ color: ATH_COLOR }}>■</span> Avg distance from ATH (right)</span>
      </div>
      {!data ? (
        <div style={{ height: 240, display: "grid", placeItems: "center", fontSize: 12, opacity: 0.5 }}>Loading…</div>
      ) : (
        <div ref={containerRef} style={{ width: "100%", height: 240, marginTop: 8 }} />
      )}
    </section>
  );
}
