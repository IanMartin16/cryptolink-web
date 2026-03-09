"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchRegime } from "@/lib/cryptoLink";

type RegimeResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  regime: {
    state: "bullish" | "bearish" | "neutral" | "mixed";
    score: number;
    confidence: number;
    summary: string;
  };
};

function esState(state: string) {
  if (state === "bullish") return "alcista";
  if (state === "bearish") return "bajista";
  if (state === "mixed") return "mixto";
  return "estable";
}

function toneForState(state: string) {
  if (state === "bullish") return "#2BFF88";
  if (state === "bearish") return "#FF6B6B";
  if (state === "mixed") return "#F7C65F";
  return "rgba(255,255,255,0.92)";
}

function formatTs(ts: string) {
  try {
    const d = new Date(ts);
    return (
      new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(d) + " UTC"
    );
  } catch {
    return ts;
  }
}

export default function RegimePanel() {
  const [data, setData] = useState<RegimeResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const res = await fetchRegime(["BTC", "ETH", "SOL"]);
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
        <h2 style={{ margin: 0 }}>Régimen del mercado</h2>
        <p style={{ marginTop: 8 }}>
          Error conectando a regime: <b>{error}</b>
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
        <h2 style={{ margin: 0 }}>Régimen del mercado</h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Cargando régimen...</p>
      </section>
    );
  }

  const regime = data.regime;
  const tone = toneForState(regime.state);
  const confidencePct = Math.round((regime.confidence ?? 0) * 100);

  return (
    <section
      style={{
        marginTop: UI.gap,
        padding: 22,
        border: `1px solid ${UI.border}`,
        borderRadius: 22,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
        minWidth: 0,
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Régimen del mercado</h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Lectura agregada del estado general del mercado.
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
          Actualizado · <code>{formatTs(data.ts)}</code>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 14,
        }}
      >
        <div
          style={{
            padding: 18,
            borderRadius: 18,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.045)",
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.72 }}>Estado actual</div>

          <div style={{ fontSize: 40, fontWeight: 900, color: tone, lineHeight: 1 }}>
            {esState(regime.state)}
          </div>

          <div style={{ fontSize: 15, opacity: 0.84 }}>{regime.summary}</div>

          <div
            style={{
              marginTop: 4,
              height: 12,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
              border: `1px solid rgba(255,255,255,0.08)`,
            }}
          >
            <div
              style={{
                width: `${Math.max(8, confidencePct)}%`,
                height: "100%",
                background: tone,
                boxShadow: `0 0 18px ${tone}55`,
              }}
            />
          </div>

          <div style={{ fontSize: 12, opacity: 0.72 }}>
            Confianza estimada: {confidencePct}%
          </div>
        </div>

        <div
          style={{
            padding: 18,
            borderRadius: 18,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.045)",
            display: "grid",
            gap: 12,
            alignContent: "start",
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.72 }}>Señales</div>

          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: tone }}>
              {confidencePct}%
            </div>
            <div style={{ fontSize: 13, opacity: 0.72 }}>Confianza</div>
          </div>

          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: tone }}>
              {Number(regime.score ?? 0).toFixed(2)}
            </div>
            <div style={{ fontSize: 13, opacity: 0.72 }}>Score agregado</div>
          </div>

          <div
            style={{
              marginTop: 4,
              paddingTop: 10,
              borderTop: `1px solid rgba(255,255,255,0.08)`,
              fontSize: 12,
              opacity: 0.72,
            }}
          >
            Fuente: {data.source}
          </div>
        </div>
      </div>
    </section>
  );
}