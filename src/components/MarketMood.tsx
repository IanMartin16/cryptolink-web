"use client";

import { useEffect, useRef, useState } from "react";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";

type Insight = { line1: string; line2: string; divergence: boolean };

type Props = {
  score: number; // -100..100
  updatedAt?: string;
  confidence?: number;
  insight?: Insight;
  status?: "live" | "restored" | "refreshing";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function moodLabel(score: number) {
  if (score >= 60) return "STRONG BULLISH";
  if (score >= 25) return "BULLISH";
  if (score > -25) return "NEUTRAL";
  if (score > -60) return "BEARISH";
  return "STRONG BEARISH";
}
function moodDirection(score: number): "up" | "down" | "flat" {
  if (score > 20) return "up";
  if (score < -20) return "down";
  return "flat";
}
function toneColor(d: "up" | "down" | "flat") {
  return d === "up" ? UI.green : d === "down" ? UI.red : UI.orangeSoft;
}
function toneGlow(d: "up" | "down" | "flat") {
  return d === "up" ? "rgba(46,229,157,0.14)" : d === "down" ? "rgba(255,107,107,0.14)" : "rgba(255,159,67,0.12)";
}
function formatTs(value?: string) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
    }).format(d) + " UTC";
  } catch {
    return value;
  }
}

export default function MarketSentiment({
  score, updatedAt, confidence, insight, status = "live",
}: Props) {
  const s = clamp(score, -100, 100);
  const label = moodLabel(s);
  const direction = moodDirection(s);
  const color = toneColor(direction);
  const glow = toneGlow(direction);
  const pct = Math.max(0, Math.min(100, (s + 100) / 2));

  // PULIDA: pulso sutil cuando el score CAMBIA (aunque cambie poco, se celebra
  // visualmente). Detecta el cambio comparando con el valor anterior.
  const prevScore = useRef(s);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (prevScore.current !== s) {
      prevScore.current = s;
      setBump(true);
      const t = setTimeout(() => setBump(false), 420);
      return () => clearTimeout(t);
    }
  }, [s]);

  return (
    <section
      style={{
        marginTop: UI.gap,
        padding: 18,
        border: `1px solid ${UI.border}`,
        borderRadius: 20,
        background: "linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
        boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 22px ${glow}`,
        minWidth: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* glow de fondo que respira (como SocialPulseBoard) — vida sin mentir sobre el dato */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 20% 30%, ${glow}, transparent 45%)`,
          pointerEvents: "none",
          animation: "clSentimentBreath 5.4s ease-in-out infinite",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", position: "relative" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.35, color: "rgba(255,255,255,0.65)" }}>
            MARKET<span style={{ color: UI.orange }}>  SENTIMENT</span>
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: "clamp(24px, 4vw, 30px)",
              fontWeight: 900,
              letterSpacing: 0.4,
              color,
              textShadow: "0 0 14px rgba(0,0,0,0.35)",
              lineHeight: 1.05,
              // pulso al cambiar el score
              transform: bump ? "scale(1.03)" : "scale(1)",
              transition: "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), color 300ms ease",
            }}
            title={label}
          >
            {label}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DataStatusBadge status={status} />
          <div style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${UI.border}`, background: "rgba(255,255,255,0.05)", fontSize: 12, opacity: 0.82, whiteSpace: "nowrap" }}>
            Updated · <code>{formatTs(updatedAt)}</code>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
        {typeof confidence === "number" ? (
          <div style={{ borderRadius: 999, border: `1px solid ${UI.border}`, background: "rgba(255,255,255,0.03)", padding: "8px 12px", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap" }}>
            Confidence: <span style={{ color: UI.orangeSoft }}>{(confidence * 100).toFixed(0)}%</span>
          </div>
        ) : null}

        <div style={{ borderRadius: 999, border: `1px solid ${UI.border}`, background: "rgba(255,255,255,0.03)", padding: "8px 12px", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap" }}>
          Score:{" "}
          <span style={{ color, transition: "color 300ms ease", fontVariantNumeric: "tabular-nums" }}>
            {s.toFixed(0)}
          </span>
        </div>
      </div>

      <div style={{ marginTop: 14, position: "relative" }}>
        <div style={{ height: 10, overflow: "hidden", borderRadius: 999, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", position: "relative" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.10))`,
              boxShadow: `0 0 16px ${glow}`,
              // transición más rica en la barra (antes 260ms lineal, ahora con easing)
              transition: "width 420ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 300ms ease",
              position: "relative",
            }}
          >
            {/* brillo que recorre la barra sutilmente, da sensación de "vivo" */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                animation: "clSentimentSheen 3.8s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.60)" }}>
          <span>Bearish</span>
          <span>Neutral</span>
          <span>Bullish</span>
        </div>
      </div>

      {insight ? (
        <div style={{ marginTop: 14, display: "grid", gap: 6, padding: 14, borderRadius: 16, border: `1px solid ${UI.border}`, background: "rgba(255,255,255,0.03)", position: "relative" }}>
          <div style={{ fontSize: 13, lineHeight: 1.4, color: "rgba(255,255,255,0.86)" }}>{insight.line1}</div>
          <div style={{ fontSize: 13, lineHeight: 1.4, color: insight.divergence ? UI.red : "rgba(255,255,255,0.80)" }}>{insight.line2}</div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes clSentimentBreath {
          0%   { opacity: 0.5; }
          50%  { opacity: 0.9; }
          100% { opacity: 0.5; }
        }
        @keyframes clSentimentSheen {
          0%   { transform: translateX(-100%); opacity: 0; }
          40%  { opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
          animation-delay: -1ms !important;
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          background-attachment: scroll !important;
          scroll-behavior: auto !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      }
      `}</style>
    </section>
  );
}
