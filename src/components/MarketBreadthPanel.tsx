"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";
import { getFiat } from "@/lib/fiatStore";

type BreadthResponse = {
  ok: boolean;
  pctAbove: number;
  above: number;
  below: number;
  neutral: number;
  excluded: number;
  movers: number;
  maWindowPoints: number;
  reading: string;
  ts?: string;
};

// horas aproximadas de la ventana (el job es 1h → puntos ≈ horas)
function maWindowLabel(points: number) {
  const days = points / 24;
  if (days >= 1) return `~${Math.round(days)}d MA`;
  return `~${points}h MA`;
}

// lectura cualitativa → texto legible + tono
function readingMeta(reading: string): { label: string; tone: string } {
  switch (reading) {
    case "broad-strength":   return { label: "Broad strength",    tone: "#2BFF88" };
    case "leaning-positive": return { label: "Leaning positive",  tone: "#7CE7B0" };
    case "mixed":            return { label: "Mixed",             tone: "#F7C65F" };
    case "leaning-negative": return { label: "Leaning negative",  tone: "#F7A65F" };
    case "broad-weakness":   return { label: "Broad weakness",    tone: "#FF6B6B" };
    default:                 return { label: "Insufficient data", tone: "rgba(255,255,255,0.6)" };
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

export default function MarketBreadthPanel({ fiat: fiatProp }: { fiat?: string } = {}) {
  const [data, setData] = useState<BreadthResponse | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError("");
        const fiat = fiatProp ?? getFiat();
        const res = await fetch(`/api/cryptolink/breadth?fiat=${encodeURIComponent(fiat)}`, {
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
    const id = setInterval(load, 60000); // breadth cambia lento
    const onFiat = () => load();
    window.addEventListener("cryptolink:fiat" as any, onFiat);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("cryptolink:fiat" as any, onFiat);
    };
  }, [fiatProp]);

  const pct = data?.pctAbove ?? 0;
  const below = data?.movers ? Math.max(0, 100 - pct) : 0;
  const meta = readingMeta(data?.reading ?? "");

  return (
    <section
      style={{
        marginTop: UI.gap,
        padding: 18,
        border: `1px solid ${UI.border}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>
            Market <span style={{ color: UI.orange }}>Breadth</span>
          </h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            % of tracked assets trading above their moving average.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DataStatusBadge status={status} />
          <div style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${UI.border}`, background: "rgba(255,255,255,0.05)", fontSize: 12, opacity: 0.82, whiteSpace: "nowrap" }}>
            {data ? maWindowLabel(data.maWindowPoints) : "—"} · Updated <code>{fmtTs(data?.ts)}</code>
          </div>
        </div>
      </div>

      {error ? (
        <p style={{ marginTop: 12 }}>Cannot load breadth: <b>{error}</b></p>
      ) : (
        <>
          {/* NÚMERO GRANDE + reading */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: "clamp(34px, 6vw, 52px)", fontWeight: 900, lineHeight: 1, color: meta.tone }}>
              {pct.toFixed(1)}%
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: meta.tone }}>{meta.label}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>above moving average</div>
          </div>

          {/* BARRA PARTIDA verde (above) / rojo (below) */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", border: `1px solid ${UI.border}` }}>
              <div style={{ width: `${pct}%`, background: "linear-gradient(90deg, #1f9d5ade, #2bff87c1)", transition: "width 300ms ease" }} />
              <div style={{ width: `${below}%`, background: "linear-gradient(90deg, #ff6b6bdc, #b23b3b)", transition: "width 300ms ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, opacity: 0.6 }}>
              <span style={{ color: "#2BFF88" }}>{data?.above ?? 0} above</span>
              <span style={{ color: "#FF6B6B" }}>{data?.below ?? 0} below</span>
            </div>
          </div>

          {/* PIE: transparencia (cuántos se evaluaron / excluidos) */}
          <div style={{ marginTop: 12, fontSize: 11, opacity: 0.5 }}>
            Based on {data?.movers ?? 0} moving assets
            {data?.neutral ? ` · ${data.neutral} flat (stablecoins, excluded)` : ""}
            {data?.excluded ? ` · ${data.excluded} without series` : ""}
          </div>
        </>
      )}
    </section>
  );
}