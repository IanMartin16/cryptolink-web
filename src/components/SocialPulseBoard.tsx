"use client";

import { useEffect, useMemo, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchSocialPulse } from "@/lib/cryptoLink";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import DataStatusBadge from "@/components/DataStatusBadge";

type SocialPulseResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  socialPulse: {
    state: "bullish" | "bearish" | "mixed" | "neutral";
    score: number;
    summary: string;
    topAssets: string[];
    tags: string[];
  };
};

function pulseTone(state: string) {
  if (state === "bullish") return "#2BFF88";
  if (state === "bearish") return "#FF6B6B";
  if (state === "mixed") return "#F7C65F";
  return "rgba(255,255,255,0.90)";
}

function pulseLabel(state: string) {
  if (state === "bullish") return "Bullish";
  if (state === "bearish") return "Bearish";
  if (state === "mixed") return "Mixed";
  return "Neutral";
}

function pulseGlow(state: string) {
  if (state === "bullish") return "rgba(43,255,136,0.12)";
  if (state === "bearish") return "rgba(255,107,107,0.12)";
  if (state === "mixed") return "rgba(247,198,95,0.12)";
  return "rgba(255,255,255,0.08)";
}

function formatTs(ts: string) {
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(d) + " UTC";
  } catch {
    return ts;
  }
}

export default function SocialPulseBoard() {
  const storedSocialPulse = useMarketSignalsStore((s: any) => s.socialPulse);
  const socialPulseUpdatedAt = useMarketSignalsStore((s: any) => s.socialPulseUpdatedAt);
  const setSocialPulseStore = useMarketSignalsStore((s: any) => s.setSocialPulse);

  const [data, setData] = useState<SocialPulseResponse | null>(storedSocialPulse ?? null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">(
    socialPulseUpdatedAt ? "restored" : "refreshing"
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        setStatus((prev) => (data ? "refreshing" : prev));

        const res = await fetchSocialPulse(["BTC", "ETH", "SOL"]);
        if (!cancelled) {
          setData(res);
          setSocialPulseStore(res);
          setStatus("live");
        }
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

  const pulse = data?.socialPulse;
  const tone = pulseTone(pulse?.state || "neutral");
  const glow = pulseGlow(pulse?.state || "neutral");

  const intensityWidth = useMemo(() => {
    const score = Number(pulse?.score ?? 0);
    return `${Math.max(8, Math.min(100, score))}%`;
  }, [pulse?.score]);

  if (error) {
    return (
      <section
        style={{
          marginTop: UI.gap,
          padding: 18,
          border: `1px solid ${UI.border}`,
          borderRadius: 20,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Social Pulse</h2>
        <p style={{ marginTop: 8 }}>
          Error loading Social Pulse: <b>{error}</b>
        </p>
      </section>
    );
  }

  if (!data || !pulse) {
    return (
      <section
        style={{
          marginTop: UI.gap,
          padding: 18,
          border: `1px solid ${UI.border}`,
          borderRadius: 20,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Social Pulse</h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Loading narrative layer...</p>
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: UI.gap,
        padding: 18,
        border: `1px solid ${UI.border}`,
        borderRadius: 22,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
        minWidth: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
  style={{
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 14,
    alignItems: "stretch",
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
      gap: 14,
      alignItems: "stretch",
    }}
  >
    <div
      style={{
        padding: 18,
        borderRadius: 20,
        border: `1px solid ${UI.border}`,
        background: "rgba(255,255,255,0.04)",
        display: "grid",
        gap: 16,
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 20% 35%, ${glow}, transparent 42%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
          position: "relative",
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.68 }}>Narrative State</div>
          <div
            style={{
              marginTop: 8,
              fontSize: "clamp(30px, 5vw, 42px)",
              fontWeight: 900,
              lineHeight: 1,
              color: tone,
              letterSpacing: -0.8,
            }}
          >
            {pulseLabel(pulse.state)}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 999,
              border: `1px solid ${UI.border}`,
              background: "rgba(255,255,255,0.045)",
              fontSize: 12,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: tone,
                boxShadow: `0 0 12px ${glow}`,
              }}
            />
            Narrative Layer
          </div>
        </div>

        <div
          style={{
            minWidth: 140,
            padding: 14,
            borderRadius: 18,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.05)",
            display: "grid",
            gap: 6,
            alignContent: "start",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.66 }}>Pulse Score</div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: tone,
              lineHeight: 1,
              letterSpacing: -0.6,
            }}
          >
            {pulse.score}
            <span style={{ fontSize: 16, opacity: 0.8, marginLeft: 4 }}>/100</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.56 }}>
            Narrative intensity
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 10,
          alignItems: "end",
          position: "relative",
          minHeight: 96,
        }}
      >
        {[...Array(12)].map((_, i) => {
          const score = Number(pulse.score ?? 0);
          const base = Math.max(10, Math.min(100, score));
          const variance = [0.58, 0.72, 0.86, 0.95, 0.82, 0.68, 0.76, 0.92, 0.74, 0.60, 0.84, 0.70][i];
          const h = Math.max(12, Math.round(base * variance));

          return (
            <div
              key={i}
              style={{
                height: `${h}px`,
                borderRadius: 999,
                background: `linear-gradient(180deg, ${tone}, rgba(255,255,255,0.10))`,
                opacity: 0.85 - i * 0.02,
                boxShadow: `0 0 14px ${glow}`,
              }}
            />
          );
        })}
      </div>
    </div>

    <div
      style={{
        padding: 18,
        borderRadius: 20,
        border: `1px solid ${UI.border}`,
        background: "rgba(255,255,255,0.04)",
        display: "grid",
        gap: 16,
        minWidth: 0,
      }}
    >
      <div>
        <div style={{ fontSize: 13, opacity: 0.68 }}>Focus Assets</div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: pulse.topAssets.length >= 3 ? "1.2fr 1fr 0.9fr" : "1.2fr 1fr",
            gap: 10,
          }}
        >
          {pulse.topAssets.map((asset, i) => (
            <div
              key={asset}
              style={{
                padding: i === 0 ? 16 : 14,
                borderRadius: 18,
                border: `1px solid ${UI.border}`,
                background: i === 0 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.045)",
                display: "grid",
                gap: 6,
                minHeight: i === 0 ? 110 : 96,
                alignContent: "end",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.56 }}>Rank {i + 1}</div>
              <div
                style={{
                  fontSize: i === 0 ? 30 : 24,
                  fontWeight: 900,
                  color: tone,
                  lineHeight: 1,
                  letterSpacing: -0.6,
                }}
              >
                {asset}
              </div>
              <div style={{ fontSize: 12, opacity: 0.58 }}>
                attention focus
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, opacity: 0.68 }}>Narrative Tags</div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {pulse.tags.map((tag) => (
            <div
              key={tag}
              style={{
                padding: "9px 12px",
                borderRadius: 999,
                border: `1px solid ${UI.border}`,
                background: "rgba(255,255,255,0.05)",
                fontSize: 12,
                color: "rgba(255,255,255,0.86)",
                whiteSpace: "nowrap",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>

  <div
    style={{
      padding: 16,
      borderRadius: 20,
      border: `1px solid ${UI.border}`,
      background: "rgba(255,255,255,0.04)",
      display: "grid",
      gap: 8,
    }}
  >
    <div style={{ fontSize: 13, opacity: 0.68 }}>Market Note</div>
    <div
      style={{
        fontSize: 16,
        lineHeight: 1.55,
        opacity: 0.9,
        maxWidth: 1100,
      }}
    >
      {pulse.summary}
    </div>
  </div>
</div>
    </section>
  );
}