"use client";

import { useEffect, useState } from "react";
import { fetchTrends } from "@/lib/socialLink";
import { UI } from "@/lib/ui";

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
  return "estable";
}

export default function TrendsPanel() {
  const [data, setData] = useState<TrendsResponse | null>(null);
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
      timeZone: "UTC",
    }).format(d) + " UTC";
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
        padding: 20,
        border: `1px solid ${UI.border}`,
        borderRadius: 20,
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Trends</h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
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
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
          marginTop: 18,
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
                    fontSize: 30,
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
                  paddingTop: 10,
                  borderTop: `1px solid rgba(255,255,255,0.08)`,
                  fontSize: 13,
                  opacity: 0.72,
                  lineHeight: 1.4,
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