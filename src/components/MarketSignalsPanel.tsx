"use client";

/**
 * MarketSignalsPanel — fusiona Market Regime + Signals Radar en un solo panel
 * honesto de estado de mercado. Opción 3: command-center simple, data 100% real.
 *
 * Reemplaza a RegimePanel y SignalsRadarPanel. Cero backend nuevo:
 *   - fetchRegime()        -> régimen (estado + composite + confianza) sobre universo
 *   - fetchMarketHealth()  -> salud (score /100 calibrado) sobre universo
 *   - /api/cryptolink/overview -> breadth real del universo para el heatmap
 *
 * Se eliminan: el radar de 4 ejes, los scores arbitrarios (factores 35/70/120 +
 * BTC/ETH/SOL hardcodeado), la confianza duplicada y el orbe decorativo.
 */

import { useEffect, useMemo, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchRegime, fetchMarketHealth } from "@/lib/cryptoLink";
import DataStatusBadge from "@/components/DataStatusBadge";

type RegimeData = {
  state: "bullish" | "bearish" | "neutral" | "mixed";
  score: number;       // composite, rango ~[-1.5, 1.5]; confidence = |score|/1.5
  confidence: number;  // 0..1
  summary: string;
};
type HealthData = {
  state: "healthy" | "stable" | "fragile" | "under_pressure";
  score: number;       // 0..100 (composite real)
  summary: string;
};
type OverviewItem = {
  symbol: string;
  change24h: number | null;
  marketCap: number | null;
};

// ---- escalas honestas ----
const REGIME_MIN = -1.5;
const REGIME_MAX = 1.5;

function toneForState(state: string) {
  if (state === "bullish") return "#2BFF88";
  if (state === "bearish") return "#FF6B6B";
  if (state === "mixed") return "#F7C65F";
  return "rgba(255,255,255,0.90)";
}
function healthTone(state: string) {
  if (state === "healthy") return "#2BFF88";
  if (state === "under_pressure") return "#FF6B6B";
  if (state === "fragile") return "#F7C65F";
  return "rgba(255,255,255,0.90)";
}
function healthLabel(state: string) {
  if (state === "healthy") return "Healthy";
  if (state === "under_pressure") return "Under Pressure";
  if (state === "fragile") return "Fragile";
  return "Stable";
}
function scoreToPct(score: number) {
  const p = ((score - REGIME_MIN) / (REGIME_MAX - REGIME_MIN)) * 100;
  return Math.max(0, Math.min(100, p));
}
// color del heatmap: verde (sube) ↔ rojo (baja), intensidad por magnitud (clamp ±8%)
function heatColor(change: number | null) {
  if (change == null || !Number.isFinite(change)) return "rgba(255,255,255,0.05)";
  const c = Math.max(-8, Math.min(8, change)) / 8; // -1..1
  return c >= 0
    ? `rgba(46,229,157,${0.10 + c * 0.55})`
    : `rgba(255,107,107,${0.10 + -c * 0.55})`;
}
function fmtPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(1)}%`;
}
function formatTs(ts?: string) {
  if (!ts) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

/* ---- Espectro de régimen: reemplaza al orbe. Muestra DÓNDE cae el composite. ---- */
function RegimeSpectrum({ score, state }: { score: number; state: string }) {
  const pct = scoreToPct(score);
  const tone = toneForState(state);
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ position: "relative", height: 12, borderRadius: 999, overflow: "hidden",
        background: "linear-gradient(90deg, #FF6B6B 0%, #F7C65F 32%, rgba(255,255,255,0.35) 50%, #F7C65F 68%, #2BFF88 100%)",
        opacity: 0.55 }}
      />
      <div style={{ position: "relative", height: 0 }}>
        {/* marcador en la posición del composite */}
        <div style={{ position: "absolute", top: -17, left: `${pct}%`, transform: "translateX(-50%)",
          width: 3, height: 18, background: tone, borderRadius: 2, boxShadow: `0 0 8px ${tone}` }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.5, letterSpacing: 0.4 }}>
        <span>Bearish</span><span>Neutral</span><span>Bullish</span>
      </div>
    </div>
  );
}

export default function MarketSignalsPanel() {
  const [regime, setRegime] = useState<RegimeData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [items, setItems] = useState<OverviewItem[]>([]);
  const [ts, setTs] = useState<string>("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError("");
        const [regimeRes, healthRes, overviewRes] = await Promise.all([
          fetchRegime(),
          fetchMarketHealth(),
          fetch("/api/cryptolink/overview?fiat=USD&page=1&limit=50", {
            headers: { accept: "application/json" },
          }).then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        if (regimeRes?.regime) setRegime(regimeRes.regime);
        if (healthRes?.marketHealth) setHealth(healthRes.marketHealth);
        if (overviewRes?.ok) setItems(overviewRes.items ?? []);
        setTs(regimeRes?.ts ?? new Date().toISOString());
        setStatus("live");
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "unknown");
      }
    }
    load();
    const id = setInterval(load, 60000);   // antes 30000 — la data se mueve cada 5min/horario
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // breadth real del heatmap
  const breadth = useMemo(() => {
    let up = 0, down = 0;
    for (const it of items) {
      if (it.change24h == null) continue;
      if (it.change24h > 0) up++;
      else if (it.change24h < 0) down++;
    }
    return { up, down, total: items.length };
  }, [items]);

  const section: React.CSSProperties = {
    marginTop: UI.gap, padding: 18, border: `1px solid ${UI.border}`, borderRadius: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    boxShadow: "0 16px 50px rgba(0,0,0,0.22)", minWidth: 0, overflow: "hidden",
  };
  const card: React.CSSProperties = {
    padding: 14, borderRadius: 16, border: `1px solid ${UI.border}`,
    background: "rgba(255,255,255,0.045)", display: "grid", gap: 10,
  };

  if (error) {
    return (
      <section style={section}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Market<span style={{ color: UI.orange }}> Signals</span></h2>
        <p style={{ marginTop: 8 }}>Cannot connect to signals: <b>{error}</b></p>
      </section>
    );
  }

  const regTone = regime ? toneForState(regime.state) : "rgba(255,255,255,0.9)";
  const hTone = health ? healthTone(health.state) : "rgba(255,255,255,0.9)";

  return (
    <section style={section}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Market<span style={{ color: UI.orange }}> Signals</span></h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Regime, health and live breadth across the universe.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DataStatusBadge status={status} />
          <div style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.05)", fontSize: 12, opacity: 0.82, whiteSpace: "nowrap" }}>
            Updated · <code>{formatTs(ts)}</code>
          </div>
        </div>
      </div>

      {/* CONDICIÓN: régimen + salud */}
      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {/* Régimen */}
        <div style={card}>
          <div style={{ fontSize: 13, opacity: 0.72 }}>Regime</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: regTone, lineHeight: 1 }}>
              {regime?.state ?? "—"}
            </span>
            <span style={{ fontSize: 13, opacity: 0.7 }}>
              confidence <b>{regime ? Math.round(regime.confidence * 100) : "—"}%</b>
            </span>
          </div>
          {regime && <RegimeSpectrum score={regime.score} state={regime.state} />}
          <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.4 }}>{regime?.summary}</div>
        </div>

        {/* Salud */}
        <div style={card}>
          <div style={{ fontSize: 13, opacity: 0.72 }}>Market Health</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: hTone, lineHeight: 1 }}>
              {health ? healthLabel(health.state) : "—"}
            </span>
            <span style={{ fontSize: 15, opacity: 0.82, color: hTone, fontWeight: 800 }}>
              {health ? `${health.score}/100` : "—"}
            </span>
          </div>
          {/* barra de salud 0-100 */}
          <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${health?.score ?? 0}%`, background: hTone,
              borderRadius: 999, transition: "width 400ms ease" }} />
          </div>
          <div style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.4 }}>{health?.summary}</div>
        </div>
      </div>

      {/* HEATMAP — breadth real del universo */}
      <div style={{ marginTop: 16, padding: 14, borderRadius: 16, border: `1px solid ${UI.border}`, background: "rgba(255,255,255,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, opacity: 0.72 }}>Market breadth · top {breadth.total} by cap</div>
          <div style={{ fontSize: 12, opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: "#2BFF88" }}>{breadth.up}↑</span>
            {" / "}
            <span style={{ color: "#FF6B6B" }}>{breadth.down}↓</span>
          </div>
        </div>
        {items.length === 0 ? (
          <div style={{ height: 120, display: "grid", placeItems: "center", fontSize: 12, opacity: 0.5 }}>
            Loading breadth…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 4 }}>
            {items.map((it) => (
              <div
                key={it.symbol}
                title={`${it.symbol} · ${fmtPct(it.change24h)}`}
                style={{
                  padding: "5px 5px", borderRadius: 6, background: heatColor(it.change24h),
                  border: "1px solid rgba(255,255,255,0.06)", minWidth: 0,
                  display: "grid", gap: 1,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.92)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.symbol}
                </div>
                <div style={{ fontSize: 9.5, opacity: 0.88, fontVariantNumeric: "tabular-nums" }}>
                  {fmtPct(it.change24h)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
