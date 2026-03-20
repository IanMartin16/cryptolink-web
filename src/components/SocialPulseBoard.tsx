"use client";

import { useEffect, useMemo, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchSocialPulse } from "@/lib/cryptoLink";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import { buildLiveNarrative } from "@/lib/social/liveNarrative";
import { fetchBasicSignals } from "@/lib/social/fetchBasicSignals"

type SocialPulseResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  socialPulse: {
    state: "bullish" | "bearish" | "mixed" | "neutral";
    breadth: "broad" | "selective" | "low";
    conviction: "strong" | "moderate" | "low";
    leadership: "concentrated" | "distributed" | "mixed";
    score: number;
    summary: string;
    topAssets: string[];
    tags: string[];
  };
};

function pulseTone(state: string) {
  if (state === "bullish") return "#6EEB8F";
  if (state === "bearish") return "#FF7B7B";
  if (state === "mixed") return "#E7B866";
  return "rgba(255,255,255,0.90)";
}

function pulseLabel(state: string) {
  if (state === "bullish") return "Bullish";
  if (state === "bearish") return "Bearish";
  if (state === "mixed") return "Mixed";
  return "Neutral";
}

function pulseGlow(state: string) {
  if (state === "bullish") return "rgba(110,235,143,0.08)";
  if (state === "bearish") return "rgba(255,123,123,0.08)";
  if (state === "mixed") return "rgba(231,184,102,0.07)";
  return "rgba(255,255,255,0.05)";
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
  const [basicSignals, setBasicSignals] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        setStatus((prev) => (data ? "refreshing" : prev));

    const pulseRes = await fetchSocialPulse(["BTC", "ETH", "SOL"]);

      let basicResData = null;
      try {
        const basicRes = await fetchBasicSignals({
          window: "1h",
          assets: ["BTC", "ETH", "SOL"],
          limit: 3,
        });
        basicResData = basicRes;
      } catch (error){
        console.error("basicSignals fetch failed", error);
        basicResData = null;
      }

      if (!cancelled) {
        setData(pulseRes);
        setSocialPulseStore(pulseRes);
        setBasicSignals(basicResData);
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
  useEffect(() => {
  if (!basicSignals) {
    console.log("BASIC SIGNALS: not loaded");
    return;
  }

  console.log("BASIC SIGNALS READY", {
    source: basicSignals.source,
    ts: basicSignals.ts,
    window: basicSignals.window,
    market: basicSignals.market,
  });
}, [basicSignals]);

  const pulse = data?.socialPulse;
  const tone = pulseTone(pulse?.state || "neutral");
  const glow = pulseGlow(pulse?.state || "neutral");

  const narrative = useMemo(() => {
  if (!pulse || !data?.ts) return null;

  return buildLiveNarrative({
    socialPulse: {
      state: pulse.state,
      score: pulse.score,
      breadth: pulse.breadth,
      conviction: pulse.conviction,
      leadership: pulse.leadership,
      summary: pulse.summary,
      topAssets: pulse.topAssets,
      tags: pulse.tags,
    },
    trends: {
      up: 0,
      down: 0,
      flat: 0,
      avgScore: 0,
      topSymbols: pulse.topAssets ?? [],
    },
    basicSignals: basicSignals?.market ?? undefined,
    backdrop: basicSignals?.backdrop ?? undefined,
    updatedAt: data.ts,
  });
}, [pulse, data?.ts, basicSignals]);
console.log("BASIC SIGNALS READY", basicSignals);
console.log("live narrative ready", narrative);
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

  const barFill =
  pulse?.state === "bullish"
    ? "linear-gradient(180deg, rgba(110,235,143,0.78), rgba(110,235,143,0.16))"
    : pulse?.state === "bearish"
    ? "linear-gradient(180deg, rgba(255,123,123,0.78), rgba(255,123,123,0.16))"
    : pulse?.state === "mixed"
    ? "linear-gradient(180deg, rgba(231,184,102,0.78), rgba(231,184,102,0.16))"
    : "linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.14))";

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
        className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
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
                background: `radial-gradient(circle at 18% 55%, ${glow}, transparent 38%)`,
                pointerEvents: "none",
                animation: "pulseGlowBreath 5.2s ease-in-out infinite"
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
                <div style={{ fontSize: 13, opacity: 0.68 }}><span style={{ color: UI.orange }}>Narrative State</span></div>
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
                      border: `1px solid rgba(255,255,255,0.10)`,
                      background: "rgba(255,255,255,0.035)",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.72)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: tone,
                        boxShadow: `0 0 8px ${glow}`,
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
                    border: `1px solid rgba(255,255,255,0.10)`,
                    background: "rgba(255,255,255,0.04)",
                    display: "grid",
                    gap: 6,
                    alignContent: "start",
                    boxShadow: "inset 0 0 18px rgba(255,255,255,0.02)"
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
                  <div style={{ fontSize: 12, opacity: 0.52 }}>
                    Narrative intensity
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                {[
                  { label: "Breadth", value: pulse.breadth },
                  { label: "Conviction", value: pulse.conviction },
                  { label: "Leadership", value: pulse.leadership },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: 12,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.035)",
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 11, opacity: 0.56 }}>{item.label}</div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.9)",
                        textTransform: "capitalize",
                        lineHeight: 1.15,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(12, 1fr)",
                  gap: 12,
                  alignItems: "end",
                  position: "relative",
                  minHeight: 96,
                }}
              >
                {[...Array(12)].map((_, i) => {
               const score = Number(pulse.score ?? 0);
               const base = Math.max(10, Math.min(100, score));
               const variance = [0.58, 0.72, 0.86, 0.95, 0.82, 0.68, 0.76, 0.92, 0.74, 0.60, 0.84, 0.70][i];
               const h = Math.max(18, Math.round(base * variance));

               return (
                  <div
                    key={i}
                    style={{
                      height: `${h}px`,
                      borderRadius: 999,
                      background: barFill,
                      opacity: 0.82 - i * 0.12,
                      boxShadow: `0 0 12px ${glow}`,
                      animation: `pulseBars ${3.8 + i * 0.12} s ease-in-out infinite`,
                      transformOrigin: "bottom center",
                      willChange: "transform, opacity",
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
              <div style={{ fontSize: 13, opacity: 0.68 }}><span style={{ color: UI.orange }}>Focus Assets</span></div>

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
                    background: i === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.035)",
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
                      color: i === 0 ? tone : "rgba(255,255,255,0.92)",
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
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.035)",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.82)",
                    whiteSpace: "nowrap",
                    boxShadow: "inset 0 0 12px rgba(255,255,255,0.015)",
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
          border: `1px solid rgba(255,255,255,0.10)`,
          background: "rgba(255,255,255,0.03)",
          display: "grid",
          gap: 10,
          boxShadow: "inset 0 0 16px rgba(255,255,255,0.015)",
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.68 }}><span style={{ color: UI.orange }}>Live Narrative</span></div>
        <div style={{ fontSize: 12, opacity: 0.58 }}>
          {narrative?.sourceType === "hybrid"
            ? "derived + real attention"
            : "derived narrative"}
        </div>

        <div
          style={{
            fontSize: 18,
            lineHeight: 1.35,
            fontWeight: 900,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: -0.2,
          }}
        >
          {narrative?.headline ?? pulse.summary}
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.74)",
            maxWidth: 1100,
          }}
        >
          {narrative?.subline ?? "Narrative layer is building from current market attention."}
        </div>

          {narrative?.themes?.length ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {narrative.themes.map((tag) => (
                <div
                  key={tag}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.035)",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.82)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          ) : null}

           {narrative?.note ? (
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.62)",
              }}
            >
              {narrative.note}
            </div>
          ) : null}
        </div>
          
        <style jsx>{`
        @keyframes pulseBars {
          0% {
            transform: scaleY(0.96);
            opacity: 0.76;
          }
          50% {
            transform: scaleY(1.03);
            opacity: 0.96;
          }
          100% {
            transform: scaleY(0.96);
            opacity: 0.76;
          }
        }

        @keyframes pulseGlowBreath {
          0% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.95;
          }
          100% {
            opacity: 0.55;
          }
        }
      `}</style> 
    </div>
    </section>
  );
}