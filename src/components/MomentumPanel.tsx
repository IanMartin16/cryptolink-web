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
  const [error, setError] = useState<string>("");

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
          padding: UI.padLg,
          border: `1px solid ${UI.border}`,
          borderRadius: UI.radiusLg,
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
          padding: UI.padLg,
          border: `1px solid ${UI.border}`,
          borderRadius: UI.radiusLg,
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
        padding: UI.padLg,
        border: `1px solid ${UI.border}`,
        borderRadius: UI.radiusLg,
        background: UI.panel,
        minWidth: 0,
      }}
    >
      <h2 style={{ margin: 0 }}>Momentum</h2>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Última actualización: <code>{data.ts}</code>
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 16,
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
                borderRadius: 16,
                border: `1px solid ${UI.border}`,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.75 }}>{m.symbol}</div>

              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: tone }}>
                {esStrength(m.strength)}
              </div>

              <div style={{ marginTop: 6, fontSize: 14, opacity: 0.85 }}>
                {esDirection(m.direction)} · {m.changePct.toFixed(2)}%
              </div>

              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.72 }}>
                Último: {m.last == null ? "N/D" : m.last.toLocaleString()} {data.fiat}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}