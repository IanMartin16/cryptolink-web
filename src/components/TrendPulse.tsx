"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchTrends } from "@/lib/socialLink";

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

function trendLabel(trend: string) {
  if (trend === "up") return "Bullish";
  if (trend === "down") return "Bearish";
  return "Neutral";
}

function trendTone(trend: string) {
  if (trend === "up") return "#2BFF88";
  if (trend === "down") return "#FF6B6B";
  return "rgba(255,255,255,0.90)";
}

export default function TrendPulsePanel() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const res = await fetchTrends(["BTC", "ETH", "SOL", "LINK", "UNI", "ATOM"]);
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
          marginTop: 0,
          padding: 16,
          border: `1px solid ${UI.border}`,
          borderRadius: 18,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Trend Pulse</h2>
        <p style={{ marginTop: 8 }}>Error loading trend pulse: <b>{error}</b></p>
      </section>
    );
  }

  if (!data) {
    return (
      <section
        style={{
          marginTop: 0,
          padding: 16,
          border: `1px solid ${UI.border}`,
          borderRadius: 18,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Trend Pulse</h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Loading trend pulse...</p>
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: 0,
        padding: 16,
        border: `1px solid ${UI.border}`,
        borderRadius: 18,
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
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Trend Pulse</h2>
          <p style={{ marginTop: 6, opacity: 0.78, fontSize: 13 }}>
            Quick signal scanner across selected assets.
          </p>
        </div>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {data.data.length} assets
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 10,
        }}
      >
        {data.data.map((t) => {
          const tone = trendTone(t.trend);

          return (
            <div
              key={t.symbol}
              style={{
                padding: 12,
                borderRadius: 14,
                border: `1px solid ${UI.border}`,
                background: "rgba(255,255,255,0.045)",
                display: "grid",
                gap: 6,
                minWidth: 0,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.72 }}>{t.symbol}</div>

              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: tone,
                  lineHeight: 1.1,
                }}
              >
                {trendLabel(t.trend)}
              </div>

              <div style={{ fontSize: 12, opacity: 0.8 }}>
                score {t.score.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}