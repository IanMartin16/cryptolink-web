"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchMomentum } from "@/lib/cryptoLink";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import DataStatusBadge from "./DataStatusBadge";


type MomentumItem = {
  symbol: string;
  direction: "up" | "down" | "flat";
  changePct: number;
  strength: "low" | "medium" | "high";
  score: number;
  last: number | null;
  source: string;
};

type MomentumResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  momentum: MomentumItem[];
};

function esDirection(direction: string) {
  if (direction === "up") return "Up";
  if (direction === "down") return "Down";
  return "Neutral";
}

function esStrength(strength: string) {
  if (strength === "high") return "High";
  if (strength === "medium") return "Medium";
  return "Low";
}

function formatTs(ts: string) {
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Mexico_City",
    }).format(d) + " Mexico City";
  } catch {
    return ts;
  }
}
function fmt(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MomentumPanel() {
  const storedMomentum = useMarketSignalsStore((s) => s.momentum);
  const setMomentumStore = useMarketSignalsStore((s) => s.setMomentum);

  const [data, setData] = useState<MomentumResponse | null>(storedMomentum);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">(
  storedMomentum ? "restored" : "refreshing"
);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const res = await fetchMomentum(["BTC", "ETH", "SOL"]);
        if (!cancelled) 
          setData(res);
          setMomentumStore(res);
          setStatus("live");
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "unknown");
      }
    }

    load();
    const id = setInterval(load, 10000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (error) {
    return (
      <section
        style={{
          marginTop: UI.gap,
          padding: 20,
          border: `1px solid ${UI.border}`,
          borderRadius: 20,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0 }}>Momentum</h2>
        <p style={{ marginTop: 8 }}>
          Error conectando a momentum: <b>{error}</b>
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section
        style={{
          marginTop: UI.gap,
          padding: 20,
          border: `1px solid ${UI.border}`,
          borderRadius: 20,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0 }}>Momentum</h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Cargando momentum...</p>
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: 20,
        padding: 16,
        border: `1px solid ${UI.border}`,
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
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
          <h2 style={{ margin: 0, fontSize: 20 }}>Momentum</h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 13 }}>
            Fuerza y consistencia del movimiento reciente.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
            <DataStatusBadge status={status} />

        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.05)",
            fontSize: 12,
            opacity: 0.82,
            whiteSpace: "nowrap",
          }}
        >
          Actualizado · <code>{formatTs(data.ts)}</code>
        </div>
      </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        {data.momentum.map((m) => {
          const tone =
            m.direction === "up"
              ? "#2BFF88"
              : m.direction === "down"
              ? "#FF6B6B"
              : "rgba(255,255,255,0.92)";

          return (
            <div
              key={m.symbol}
              style={{
                padding: 14,
                borderRadius: 16,
                border: `1px solid ${UI.border}`,
                background: "rgba(255,255,255,0.045)",
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
                <div style={{ fontSize: 13, opacity: 0.72, letterSpacing: 0.3 }}>
                  {m.symbol}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: `1px solid ${UI.border}`,
                    background: "rgba(255,255,255,0.05)",
                    color: tone,
                    fontWeight: 700,
                  }}
                >
                  {esDirection(m.direction)}
                </div>
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: tone,
                    lineHeight: 1,
                  }}
                >
                  {esStrength(m.strength)}
                </div>

                <div style={{ fontSize: 13, opacity: 0.82 }}>
                  Fluctuation {m.changePct.toFixed(2)}% · score {m.score.toFixed(2)}
                </div>
              </div>

              <div
                style={{
                  marginTop: 2,
                  paddingTop: 8,
                  borderTop: `1px solid rgba(255,255,255,0.08)`,
                  fontSize: 12,
                  opacity: 0.72,
                }}
              >
                Last: {m.last == null ? "N/D" : m.last.toLocaleString()} {data.fiat}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}