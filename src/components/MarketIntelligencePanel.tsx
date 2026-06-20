"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";
import { getFiat } from "@/lib/fiatStore";
import { getSymbols } from "@/lib/symbolsStore";
import {
  fetchAnomalies,
  fetchRiskFlags,
  fetchSnapshot,
  type AnomaliesResponse,
  type RiskFlagsResponse,
  type SnapshotResponse,
} from "@/lib/cryptoLink";


const DEFAULT_SYMBOLS = ["BTC", "ETH", "SOL", "ETHFI", "JUP", "LINK"];

function moodTone(mood?: string) {
  const m = (mood ?? "neutral").toLowerCase();
  if (m === "bullish") return "#2BFF88";
  if (m === "bearish") return "#FF6B6B";
  if (m === "mixed") return "#F7C65F";
  return "rgba(255,255,255,0.92)";
}

function moodLabel(mood?: string) {
  const m = (mood ?? "neutral").toLowerCase();
  return m.charAt(0).toUpperCase() + m.slice(1);
}

function severityTone(sev?: string) {
  const s = (sev ?? "low").toLowerCase();
  if (s === "high") return { c: "#FF6B6B", bg: "rgba(255,107,107,0.10)", b: "rgba(255,107,107,0.25)" };
  if (s === "medium") return { c: "#F7C65F", bg: "rgba(247,198,95,0.10)", b: "rgba(247,198,95,0.22)" };
  return { c: "rgba(255,255,255,0.78)", bg: "rgba(255,255,255,0.05)", b: UI.border };
}

function fmtTs(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default function MarketIntelligencePanel({
  symbols = DEFAULT_SYMBOLS,
  fiat = "USD",
}: {
  symbols?: string[];
  fiat?: string;
}) {
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [risk, setRisk] = useState<RiskFlagsResponse | null>(null);
  const [snap, setSnap] = useState<SnapshotResponse | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");

  useEffect(() => {
  let cancelled = false;

  async function load() {
    try {
      setError("");
      const fiat = getFiat();                      // ← fiat actual del portal
      const list = getSymbols();
      const syms = list.length ? list : DEFAULT_SYMBOLS;

      const [a, r, s] = await Promise.all([
        fetchAnomalies(syms, fiat),
        fetchRiskFlags(syms, fiat),
        fetchSnapshot(syms, fiat),
      ]);

      if (!cancelled) {
        setAnomalies(a);
        setRisk(r);
        setSnap(s);
        setStatus("live");
      }
    } catch (e: any) {
      if (!cancelled) setError(e?.message ?? "unknown");
    }
  }

  load();
  const id = setInterval(load, 10000);

  const onFiat = () => load();
  const onSymbols = () => load();
  window.addEventListener("cryptolink:fiat" as any, onFiat);
  window.addEventListener("cryptolink:symbols" as any, onSymbols);

  return () => {
    cancelled = true;
    clearInterval(id);
    window.removeEventListener("cryptolink:fiat" as any, onFiat);
    window.removeEventListener("cryptolink:symbols" as any, onSymbols);
  };
}, []);   // ← dependencias vacías; los eventos manejan la reactividad

  const mood = snap?.snapshot?.marketMood;
  const tone = moodTone(mood);
  const anomalyList = anomalies?.anomalies ?? [];
  const flagList = risk?.flags ?? [];

  if (error) {
    return (
      <section
        style={{
          marginTop: UI.gap,
          padding: 20,
          border: `1px solid ${UI.border}`,
          borderRadius: 18,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0 }}>Market <span style={{ color: UI.orange }}>Intelligence</span></h2>
        <p style={{ marginTop: 8 }}>Cannot load intelligence layer: <b>{error}</b></p>
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: UI.gap,
        padding: 18,
        border: `1px solid ${UI.border}`,
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* ENCABEZADO: */}
      <div
        style={{
          marginTop: 14,
          padding: 16,
          borderRadius: 16,
          border: `1px solid ${UI.border}`,
          background: "rgba(255,255,255,0.04)",
          display: "grid",
          gap: 10,
        }}
      >
        {/* summary del back interpretive — esto SÍ es real */}
        {(anomalies?.summary || risk?.summary || snap?.snapshot?.summary) ? (
          <div
            style={{
              fontSize: "clamp(18px, 3vw, 22px)",
              fontWeight: 800,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: -0.2,
              maxWidth: 820,
            }}
          >
            {anomalies?.summary || risk?.summary || snap?.snapshot?.summary}
          </div>
        ) : (
          <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
            Market intelligence read
          </div>
        )}

        {/* mood como chip pequeño de soporte (no héroe) */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content" }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>Market mood:</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              border: `1px solid ${UI.border}`,
              background: "rgba(255,255,255,0.04)",
              fontSize: 12,
              fontWeight: 800,
              color: tone,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: tone,
                flexShrink: 0,
              }}
            />
            {moodLabel(mood)}
          </span>
        </div>
      </div>

      {/* CUERPO: anomalies (lo más rico — liga a símbolo) */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, opacity: 0.72, marginBottom: 8 }}>
          <span style={{ color: UI.orange }}>Anomalies</span>
        </div>

        {anomalyList.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 10,
            }}
          >
            {anomalyList.map((a, i) => {
              const sev = severityTone(a.severity);
              return (
                <div
                  key={`${a.symbol}-${i}`}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: `1px solid ${sev.b}`,
                    background: sev.bg,
                    display: "grid",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontWeight: 950, fontSize: 16 }}>{a.symbol}</div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 9px",
                        borderRadius: 999,
                        border: `1px solid ${sev.b}`,
                        color: sev.c,
                        textTransform: "uppercase",
                        letterSpacing: 0.3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.severity}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    {a.type?.replace(/_/g, " ")}
                    {typeof a.score === "number" ? ` · ${a.score.toFixed(2)}` : ""}
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}>
                    {a.detail}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: `1px solid ${UI.border}`,
              background: "rgba(255,255,255,0.03)",
              fontSize: 13,
              opacity: 0.7,
            }}
          >
            No anomalies detected right now.
          </div>
        )}
      </div>

      {/* SOPORTE: risk flags (chips) — solo si hay */}
      {flagList.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, opacity: 0.72, marginBottom: 8 }}>
            <span style={{ color: UI.orange }}>Risk Flags</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {flagList.map((f, i) => {
              const sev = severityTone(f.severity);
              return (
                <div
                  key={`${f.code}-${i}`}
                  title={f.detail}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: `1px solid ${sev.b}`,
                    background: sev.bg,
                    fontSize: 12,
                    maxWidth: "100%",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: sev.c,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 800, whiteSpace: "nowrap" }}>{f.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
