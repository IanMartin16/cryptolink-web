"use client";

import { useEffect, useState } from "react";
import { fetchTrends } from "@/lib/socialLink";
import { UI } from "@/lib/ui";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";


type TrendItem = {
  symbol: string;
  trend: "up" | "down" | "flat";
  score: number;
  reason: string;
};

type TrendsResponse = {
  ts: string;
  data: TrendItem[];
};

function esTrend(trend: string) {
  if (trend === "up") return "Up";
  if (trend === "down") return "Down";
  return "Neutral";
}

export default function TrendsPanel() {
  const storedTrends = useMarketSignalsStore((s) => s.trends);
  const setTrendsStore = useMarketSignalsStore((s) => s.setTrends);

  const [data, setData] = useState<TrendsResponse | null>(storedTrends);
  const [error, setError] = useState("");

  //formato de hora  fecha
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const res = await fetchTrends(["BTC", "ETH", "SOL"]);
        if (!cancelled) 
          setData(res);
          setTrendsStore(res);
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
        <h2 style={{ margin: 0 }}>Trends</h2>
        <p style={{ marginTop: 8 }}>
          Error conectando a CryptoLink trends: <b>{error}</b>
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
        <h2 style={{ margin: 0 }}>Trends</h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Cargando trends...</p>
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
        position: "relative",
        overflow: "hidden",
        minWidth: 0,
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
          <h2 style={{ margin: 0, fontSize: 20 }}>Trends</h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 13 }}>
            Dirección reciente del mercado y lectura derivada.
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
          Updated · <code>{formatTs(data.ts)}</code>
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
        {[...data.data].sort((a, b) => b.score - a.score).map((t) => {
          const tone =
            t.trend === "up"
              ? "#2BFF88"
              : t.trend === "down"
              ? "#FF6B6B"
              : "rgba(255,255,255,0.92)";

          return (
            <div
              key={t.symbol}
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
                  {t.symbol}
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
                  {esTrend(t.trend)}
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
                  {t.score.toFixed(2)}
                </div>

                <div style={{ fontSize: 14, opacity: 0.82 }}>
                  Trends Score
                </div>
              </div>

              <div
                style={{
                  marginTop: 2,
                  paddingTop: 8,
                  borderTop: `1px solid rgba(255,255,255,0.08)`,
                  fontSize: 12,
                  opacity: 0.72,
                  lineHeight: 1.35,
                }}
              >
                {t.reason}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}