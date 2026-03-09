"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchMomentum } from "@/lib/cryptoLink";

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
  if (direction === "up") return "alcista";
  if (direction === "down") return "bajista";
  return "estable";
}

function esStrength(strength: string) {
  if (strength === "high") return "alto";
  if (strength === "medium") return "medio";
  return "bajo";
}

export default function MomentumPanel() {
  const [data, setData] = useState<MomentumResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const res = await fetchMomentum(["BTC", "ETH", "SOL"]);
        if (!cancelled) setData(res);
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
        marginTop: UI.gap,
        padding: 20,
        border: `1px solid ${UI.border}`,
        borderRadius: 20,
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Momentum</h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Fuerza y consistencia del movimiento reciente.
          </p>
        </div>

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
          Updated · <code>{data.ts}</code>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
          marginTop: 18,
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
                padding: 16,
                borderRadius: 18,
                border: `1px solid ${UI.border}`,
                background: "rgba(255,255,255,0.045)",
                display: "grid",
                gap: 10,
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
                    textTransform: "uppercase",
                  }}
                >
                  {esDirection(m.direction)}
                </div>
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: tone,
                    lineHeight: 1,
                  }}
                >
                  {esStrength(m.strength)}
                </div>

                <div style={{ fontSize: 14, opacity: 0.82 }}>
                  {m.changePct.toFixed(2)}% · score {m.score.toFixed(2)}
                </div>
              </div>

              <div
                style={{
                  marginTop: 2,
                  paddingTop: 10,
                  borderTop: `1px solid rgba(255,255,255,0.08)`,
                  fontSize: 13,
                  opacity: 0.72,
                }}
              >
                Último: {m.last == null ? "N/D" : m.last.toLocaleString()} {data.fiat}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}