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
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 18% 55%, ${glow}, transparent 36%)`,
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
          <h2 style={{ margin: 0, fontSize: 22 }}>Social Pulse</h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Narrative and attention layer across selected assets
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
            Updated · <code>{formatTs(data.ts)}</code>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
          gap: 14,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.04)",
            display: "grid",
            gap: 14,
            minWidth: 0,
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
              <div style={{ fontSize: 13, opacity: 0.72 }}>Narrative State</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: "clamp(28px, 5vw, 38px)",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: tone,
                }}
              >
                {pulseLabel(pulse.state)}
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 16,
                border: `1px solid ${UI.border}`,
                background: "rgba(255,255,255,0.05)",
                minWidth: 120,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.68 }}>Pulse Score</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 28,
                  fontWeight: 900,
                  color: tone,
                  lineHeight: 1,
                }}
              >
                {pulse.score}
                <span style={{ fontSize: 16, opacity: 0.8, marginLeft: 4 }}>/100</span>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              height: 14,
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid rgba(255,255,255,0.08)`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: intensityWidth,
                height: "100%",
                borderRadius: 999,
                background: tone,
                boxShadow: `0 0 18px ${glow}`,
                transition: "width 300ms ease",
              }}
            />
          </div>

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              opacity: 0.88,
              maxWidth: 760,
            }}
          >
            {pulse.summary}
          </div>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 18,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.04)",
            display: "grid",
            gap: 14,
            minWidth: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 13, opacity: 0.72 }}>Focus Assets</div>
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
                gap: 10,
              }}
            >
              {pulse.topAssets.map((asset, i) => (
                <div
                  key={asset}
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    border: `1px solid ${UI.border}`,
                    background: "rgba(255,255,255,0.045)",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.58 }}>Rank {i + 1}</div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: tone,
                      lineHeight: 1,
                    }}
                  >
                    {asset}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, opacity: 0.72 }}>Narrative Tags</div>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {pulse.tags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    padding: "8px 10px",
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
    </section>
  );
}