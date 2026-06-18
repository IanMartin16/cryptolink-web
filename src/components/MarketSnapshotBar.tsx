"use client";

import { useEffect, useMemo, useState } from "react";
import DataStatusBadge from "@/components/DataStatusBadge";
import type { SnapshotKPIs, SnapshotKPI } from "@/lib/types";
import { UI } from "@/lib/ui";

type Props = {
  snapshot: SnapshotKPIs;
  status?: "live" | "restored" | "refreshing";
};

function toneStyles(tone: SnapshotKPI["tone"]) {
  switch (tone) {
    case "good":
      return {
        border: "1px solid rgba(46,229,157,0.18)",
        background: "rgba(46,229,157,0.08)",
        color: "rgba(220,255,236,0.95)",
      };
    case "warn":
      return {
        border: "1px solid rgba(255,159,67,0.18)",
        background: "rgba(255,159,67,0.08)",
        color: "rgba(255,238,214,0.95)",
      };
    case "bad":
      return {
        border: "1px solid rgba(255,107,107,0.18)",
        background: "rgba(255,107,107,0.08)",
        color: "rgba(255,226,226,0.95)",
      };
    default:
      return {
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.035)",
        color: "rgba(255,255,255,0.86)",
      };
  }
}

function formatAgeMs(updatedAt: number) {
  const secs = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

/**
 * "Calibrating" coherente: si CUALQUIER KPI viene en estado de arranque
 * (warming — Up/Down esperando el segundo ciclo de precios), toda la barra
 * se muestra calibrando, en vez de mezclar dos KPIs firmes con dos "warming".
 * Detectamos warming por el value que el engine pone ("warming…").
 */
function isWarming(items: SnapshotKPI[]) {
  return items.some((k) => typeof k.value === "string" && k.value.toLowerCase().includes("warming"));
}

export default function MarketSnapshotBar({ snapshot, status = "live" }: Props) {
  const items = snapshot?.items ?? [];
  const [ageLabel, setAgeLabel] = useState(() => formatAgeMs(snapshot.updatedAt));

  useEffect(() => {
    setAgeLabel(formatAgeMs(snapshot.updatedAt));
    const id = setInterval(() => setAgeLabel(formatAgeMs(snapshot.updatedAt)), 1000);
    return () => clearInterval(id);
  }, [snapshot.updatedAt]);

  const hasItems = items.length > 0;
  const warming = useMemo(() => isWarming(items), [items]);

  return (
    <section
      style={{
        marginTop: 0,
        padding: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 18,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012))",
        boxShadow: "0 12px 34px rgba(0,0,0,0.22)",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 0.35,
                color: "rgba(255,255,255,0.66)",
              }}
            >
              <span style={{ color: UI.orange }}>MARKET SNAPSHOT</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
              Fast read of key market conditions
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <DataStatusBadge status={status} />
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                fontSize: 12,
                color: "rgba(255,255,255,0.72)",
                whiteSpace: "nowrap",
              }}
            >
              Updated · <code>{ageLabel}</code>
            </div>
          </div>
        </div>

        {/* CUERPO */}
        {!hasItems ? (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", padding: "4px 0" }}>
            No snapshot items available.
          </div>
        ) : warming ? (
          // Estado de arranque uniforme (≈1 ciclo de precios). Coherente: toda
          // la barra calibra, en vez de mezclar números firmes con "warming".
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.035)",
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
              width: "fit-content",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: UI.orange,
                boxShadow: `0 0 10px ${UI.orange}`,
                animation: "clPulse 900ms ease-in-out infinite",
              }}
            />
            Calibrating market read…
          </div>
        ) : (
          // TICKER estilo BMV: loop horizontal lento, pausa al hover,
          // respeta prefers-reduced-motion (cae a fila estática con scroll).
          <div className="cl-ticker-mask">
            <div className="cl-ticker-track">
              {/* dos copias seguidas → loop continuo sin salto */}
              {[0, 1].map((copy) => (
                <div className="cl-ticker-group" key={copy} aria-hidden={copy === 1}>
                  {items.map((kpi) => (
                    <KPIChip key={`${copy}-${kpi.key}`} kpi={kpi} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .cl-ticker-mask {
          overflow: hidden;
          width: 100%;
          /* difumina los bordes para que los chips "entren y salgan" suave */
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0,
            #000 6%,
            #000 94%,
            transparent 100%
          );
          mask-image: linear-gradient(
            90deg,
            transparent 0,
            #000 6%,
            #000 94%,
            transparent 100%
          );
        }
        .cl-ticker-track {
          display: flex;
          width: max-content;
          animation: clTickerScroll 38s linear infinite; /* lento, no estresa */
        }
        .cl-ticker-track:hover {
          animation-play-state: paused; /* pausa al hover para poder leer */
        }
        .cl-ticker-group {
          display: flex;
          gap: 8px;
          padding-right: 8px;
          flex-shrink: 0;
        }
        @keyframes clTickerScroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%); /* avanza exactamente una copia */
          }
        }
        /* Accesibilidad: si el usuario pide menos movimiento, no corre.
           Cae a fila estática con scroll horizontal manual. */
        @media (prefers-reduced-motion: reduce) {
          .cl-ticker-track {
            animation: none;
            width: 100%;
            overflow-x: auto;
          }
          .cl-ticker-group:nth-child(2) {
            display: none; /* sin loop, una sola copia */
          }
        }
      `}</style>
    </section>
  );
}

function KPIChip({ kpi }: { kpi: SnapshotKPI }) {
  const tone = toneStyles(kpi.tone);

  return (
    <div
      style={{
        ...tone,
        flexShrink: 0,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 14,
        boxShadow: "inset 0 0 10px rgba(255,255,255,0.015)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 0.35,
          opacity: 0.76,
          whiteSpace: "nowrap",
        }}
      >
        {kpi.label}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {kpi.value}
      </div>

      {kpi.sub ? (
        <div style={{ fontSize: 11, opacity: 0.68, whiteSpace: "nowrap" }}>
          {kpi.sub}
        </div>
      ) : null}
    </div>
  );
}
