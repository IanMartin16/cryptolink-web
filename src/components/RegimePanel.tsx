"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchRegime } from "@/lib/cryptoLink";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import DataStatusBadge from "@/components/DataStatusBadge";
import { fetchMarketHealth } from "@/lib/cryptoLink";

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
type MarketHealthResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  marketHealth: {
    state: "healthy" | "stable" | "fragile" | "under_pressure";
    score: number;
    summary: string;
  };
};

function esState(state: string) {
  if (state === "bullish") return "bullish";
  if (state === "bearish") return "bearish";
  if (state === "mixed") return "mixed";
  return "neutral";
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
        timeZone: "America/Mexico_City",
      }).format(d) + " Mexico City"
    );
  } catch {
    return ts;
  }
}

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  function healthTone(state: string) {
  if (state === "healthy") return "#2BFF88";
  if (state === "under_pressure") return "#FF6B6B";
  if (state === "fragile") return "#F7C65F";
  return "rgba(255,255,255,0.92)";
}

function healthLabel(state: string) {
  if (state === "healthy") return "Healthy";
  if (state === "under_pressure") return "Under Pressure";
  if (state === "fragile") return "Fragile";
  return "Stable";
}

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) {
  const start = polarPoint(cx, cy, r, startDeg);
  const end = polarPoint(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function ConfidenceGauge({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const size = 150;
  const cx = size / 2;
  const cy = size / 2;
  const r = 42;

  const clamped = Math.max(0, Math.min(100, value));
  const startDeg = 140;
  const endDeg = 400;
  const sweep = endDeg - startDeg;
  const activeEnd = startDeg + (clamped / 100) * sweep;

  const bgPath = arcPath(cx, cy, r, startDeg, endDeg);
  const fgPath = arcPath(cx, cy, r, startDeg, activeEnd);

  return (
    <div
      style={{
        width: size,
        minWidth: size,
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={fgPath}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 8px ${color}66)`,
          }}
        />

        <circle
          cx={cx}
          cy={cy}
          r="28"
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.08)"
        />

        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="rgba(255,255,255,0.96)"
          fontSize="22"
          fontWeight="900"
        >
          {clamped}%
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fill="rgba(255,255,255,0.50)"
          fontSize="10"
          fontWeight="700"
          letterSpacing="0.08em"
        >
          CONF
        </text>
      </svg>
    </div>
  );
}

export default function RegimePanel() {
  const storedRegime = useMarketSignalsStore((s) => s.regime);
  const setRegimeStore = useMarketSignalsStore((s) => s.setRegime);

  const [data, setData] = useState<RegimeResponse | null>(storedRegime);
  const [error, setError] = useState("");
  const storedMarketHealth = useMarketSignalsStore((s: any) => s.marketHealth);
  const setMarketHealthStore = useMarketSignalsStore((s: any) => s.setMarketHealth);

  const [mh, setMh] = useState<MarketHealthResponse | null>(storedMarketHealth ?? null);
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">(
  storedRegime ? "restored" : "refreshing"
);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        setStatus((prev) => (data ? "refreshing" : prev));

        const [regimeRes, healthRes] = await Promise.all([
          fetchRegime(["BTC", "ETH", "SOL"]),
          fetchMarketHealth(["BTC", "ETH", "SOL"]),
        ]);

        if (!cancelled) {
          setData(regimeRes);
          setRegimeStore(regimeRes);

          setMh(healthRes);
          setMarketHealthStore(healthRes);

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
        <h2 style={{ margin: 0 }}>Market Regime</h2>
        <p style={{ marginTop: 8 }}>
          Cannot connect to regime: <b>{error}</b>
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
        <h2 style={{ margin: 0 }}>Market Regime</h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Loading Regime...</p>
      </section>
    );
  }

  const regime = data.regime;
  const tone = toneForState(regime.state);
  const confidencePct = Math.round((regime.confidence ?? 0) * 100);
  const orb = orbGlow(regime.state, regime.confidence ?? 0);

  function orbGlow(state: string, confidence: number) {
    const c = clamp(confidence ?? 0, 0, 1);

    if (state === "bullish") {
      return {
        core: "#2BFF88",
        glow: `rgba(43,255,136,${0.18 + c * 0.35})`,
        ring: `rgba(43,255,136,${0.22 + c * 0.28})`,
      };
    }

    if (state === "bearish") {
      return {
        core: "#FF6B6B",
        glow: `rgba(255,107,107,${0.18 + c * 0.35})`,
        ring: `rgba(255,107,107,${0.22 + c * 0.28})`,
      };
    }

    if (state === "mixed") {
      return {
        core: "#F7C65F",
        glow: `rgba(247,198,95,${0.18 + c * 0.30})`,
        ring: `rgba(247,198,95,${0.22 + c * 0.24})`,
      };
    }

    return {
      core: "rgba(255,255,255,0.88)",
      glow: `rgba(255,255,255,${0.10 + c * 0.18})`,
      ring: `rgba(255,255,255,${0.12 + c * 0.16})`,
    };
  }

  return (
    <section
      style={{
        marginTop: UI.gap,
        padding: 18,
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
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Market<span style={{ color: UI.orange }}> Regime</span></h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Aggregate view of the market's current condition.
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
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14,
          alignItems: "center",
        }}
      >
        {/* Card right */ }
        <div
          style={{
          padding: 14,
          borderRadius: 16,
          border: `1px solid ${UI.border}`,
          background: "rgba(255,255,255,0.045)",
          display: "grid",
          gap: 10,
          height: "100%",
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.72 }}>Current State</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 14,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "min(128px, 30vw)",
              height: "min(128px, 30vw)",
              borderRadius: "50%",
              position: "relative",
              margin: "0 auto",
              transition: "box-shadow 300ms ease, border-color 300ms ease, background 300ms ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${orb.glow} 0%, rgba(255,255,255,0.08) 28%, rgba(0,0,0,0) 72%)`,
                filter: "blur(20px)",
                animation: "orbHalo 3.6s ease-in-out infinite",
              }}
            />

            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                position: "relative",
                background: `
                  radial-gradient(circle at 35% 35%, rgba(255,255,255,0.42), transparent 26%),
                  radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent 42%),
                  radial-gradient(circle, ${orb.core} 0%, ${orb.glow} 44%, rgba(0,0,0,0) 76%)
                `,
                boxShadow: `
                  0 0 34px ${orb.glow},
                  0 0 72px ${orb.glow},
                  0 0 110px rgba(255,255,255,0.10),
                  inset 0 0 24px rgba(255,255,255,0.14)
                `,
                border: `1px solid ${orb.ring}`,
                animation: "orbBreath 3.8s ease-in-out infinite, orbCoreDrift 6s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 10,
                  borderRadius: "50%",
                  border: `1px solid ${orb.ring}`,
                  opacity: 0.9,
                }}
              />
              <div
                  style={{
                    position: "absolute",
                    inset: 22,
                    borderRadius: "50%",
                    border: `1px solid rgba(255,255,255,0.10)`,
                    opacity: 0.9,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  fontSize: "clamp(28px, 5.4vw, 36px)",
                  letterSpacing: -0.6,
                  fontWeight: 900,
                  color: tone,
                  lineHeight: 1,
                }}
              >
                {esState(regime.state)}
              </div>

              <div style={{ fontSize: 14, opacity: 0.8 }}>
                Confidence: <b>{confidencePct}%</b>
              </div>

              <div style={{ fontSize: 14, opacity: 0.8 }}>
                Composite Score: <b>{Number(regime.score ?? 0).toFixed(2)}</b>
              </div>

              <div
                style={{
                  fontSize: "clamp(13px, 3.2vw, 14px)",
                  opacity: 0.84,
                  lineHeight: 1.4,
                  maxWidth:520,
                }}
              >
                {regime.summary}
              </div>
            </div>
          </div>
        </div>

        {/* Card left */ }
        <div
          style={{
            padding: 14,
            borderRadius: 16,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.045)",
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
            gap: 12,
            minHeight: 320,
            height: "100%",
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.72 }}>Signals</div>

          <div
            style={{
              display: "grid",
              placeItems: "center",
              alignSelf: "center",
              minHeight: 170,
            }}
          >
            <div
              style={{
                transform: "scale(1.28)",
                transformOrigin: "center",
              }}
            >
              <ConfidenceGauge value={confidencePct} color={tone} />
            </div>
          </div>

            {mh?.marketHealth ? (
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: `1px solid ${UI.border}`,
              background: "rgba(255,255,255,0.04)",
              display: "grid",
              gap: 6,
              alignSelf: "end",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.72 }}>Market Health</div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: healthTone(mh.marketHealth.state),
                lineHeight: 1.1,
              }}
            >
              {healthLabel(mh.marketHealth.state)}
            </div>

            <div
              style={{
                fontSize: 13,
                opacity: 0.82,
                color: healthTone(mh.marketHealth.state),
                fontWeight: 700,
              }}
            >
             {mh.marketHealth.score}/100
            </div>
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.78,
              lineHeight: 1.4,
            }}
          >
            {mh.marketHealth.summary}
          </div>
        </div>
        ) : null}
      </div>
      </div>
      <style jsx>{`
        @keyframes orbBreath {
          0% {
          transform: scale(0.985);
          filter: brightness(0.96);
        }
          50% {
          transform: scale(1.04);
          filter: brightness(1.08);
        }
          100% {
          transform: scale(0.985);
          filter: brightness(0.96);
          }
        }

        @keyframes orbHalo {
          0% {
            opacity: 0.58;
            transform: scale(0.96);
          }
          50% {
            opacity: 0.98;
            transform: scale(1.08);
          }
          100% {
            opacity: 0.58;
            transform: scale(0.96);
          }
        }

        @keyframes orbCoreDrift {
          0% {
            transform: translate3d(0px, 0px, 0);
          }
          25% {
            transform: translate3d(1px, -1px, 0);
          }  
          50% {
            transform: translate3d(0px, 1px, 0);
          }
          75% {
            transform: translate3d(-1px, 0px, 0);
          }
          100% {
            transform: translate3d(0px, 0px, 0);
          }
        }
      `}</style>
    </section>  
  );
}