"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchRegime } from "@/lib/cryptoLink";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import DataStatusBadge from "@/components/DataStatusBadge";


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
        timeZone: "America/Mexico_City",
      }).format(d) + ""
    );
  } catch {
    return ts;
  }
}

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

export default function RegimePanel() {
  const storedRegime = useMarketSignalsStore((s) => s.regime);
  const setRegimeStore = useMarketSignalsStore((s) => s.setRegime);

  const [data, setData] = useState<RegimeResponse | null>(storedRegime);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">(
  storedRegime ? "restored" : "refreshing"
);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const res = await fetchRegime(["BTC", "ETH", "SOL"]);
        if (!cancelled) 
          setData(res);
          setRegimeStore(res);
          setStatus("live");
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
  const orb = orbGlow(regime.state, regime.confidence ?? 0);


  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
    }

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
          <h2 style={{ margin: 0, fontSize: 22 }}>Régimen del mercado</h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Lectura agregada del estado general del mercado.
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
            Actualizado · <code>{formatTs(data.ts)}</code>
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
        <div style={{ fontSize: 13, opacity: 0.72 }}>Estado actual</div>

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
              width: "min(110px, 28vw)",
              height: "min(110px, 28vw)",
              borderRadius: "50%",
              position: "relative",
              margin: "0 auto",
              transition: "box-shadow 300ms ease, border-color 300ms ease, background 300ms ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: orb.glow,
                filter: "blur(16px)",
                animation: "orbHalo 4.2s ease-in-out infinite",
              }}
            />

            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                position: "relative",
                background: `
                  radial-gradient(circle at 35% 35%, rgba(255,255,255,0.28), transparent 28%),
                  radial-gradient(circle, ${orb.core} 0%, ${orb.glow} 42%, rgba(0,0,0,0) 72%)
                `,
                boxShadow: `
                  0 0 28px ${orb.glow},
                  0 0 54px ${orb.glow},
                  inset 0 0 18px rgba(255,255,255,0.08)
                `,
                border: `1px solid ${orb.ring}`,
                animation: "orbBreath 4.2s ease-in-out infinite, orbCoreDrift 6s ease-in-out infinite",
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
                  fontSize: "clamp(26px, 5vw, 32px)",
                  fontWeight: 900,
                  color: tone,
                  lineHeight: 1,
                }}
              >
                {esState(regime.state)}
              </div>

              <div style={{ fontSize: 14, opacity: 0.8 }}>
                Confianza estimada: <b>{confidencePct}%</b>
              </div>

              <div style={{ fontSize: 14, opacity: 0.8 }}>
                Score agregado: <b>{Number(regime.score ?? 0).toFixed(2)}</b>
              </div>

              <div
                style={{
                  fontSize: "clamp(13px, 3.4vw, 14px)",
                  opacity: 0.84,
                  lineHeight: 1.45,
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
            gap: 10,
            alignContent: "start",
            height: "100%",
          }}
        >
        <div style={{ fontSize: 13, opacity: 0.72 }}>Señales</div>

        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: tone }}>
            {confidencePct}%
          </div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>Confianza</div>
        </div>

        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: tone }}>
          {Number(regime.score ?? 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.72 }}>Score agregado</div>
        </div>

        <div
          style={{
            marginTop: 4,
            paddingTop: 8,
            borderTop: `1px solid rgba(255,255,255,0.08)`,
            fontSize: 12,
            opacity: 0.72,
          }}
        >
          Fuente: {data.source}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes orbBreath {
          0% {
          transform: scale(1);
          filter: brightness(1);
        }
          50% {
          transform: scale(1.035);
          filter: brightness(1.08);
        }
          100% {
          transform: scale(1);
          filter: brightness(1);
          }
        }

        @keyframes orbHalo {
          0% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.06);
          }
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
        }

        @keyframes orbCoreDrift {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </section>  
  );
}