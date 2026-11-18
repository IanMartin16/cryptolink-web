// components/AttentionSummary.tsx
import type { AttentionStats } from "@/lib/hooks/useMarketAttention";

const MOOD = {
  BULLISH: { label: "Heating", color: "#2EE59D", bg: "rgba(46,229,157,0.10)", bd: "rgba(46,229,157,0.25)" },
  BEARISH: { label: "Cooling", color: "#FF6B6B", bg: "rgba(255,107,107,0.10)", bd: "rgba(255,107,107,0.25)" },
  NEUTRAL: { label: "Steady",  color: "rgba(255,255,255,0.75)", bg: "rgba(255,255,255,0.05)", bd: "rgba(255,255,255,0.14)" },
} as const;

export default function AttentionSummary({ stats }: { stats: AttentionStats }) {
  const m = MOOD[stats.mood] ?? MOOD.NEUTRAL;
  return (
    <div style={{
      minWidth: 210, padding: 14, borderRadius: 16,
      border: `1px solid ${m.bd}`, background: m.bg,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* MITAD 1 — mood badge */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase", opacity: 0.6 }}>
          Attention
        </span>
        <span style={{ fontSize: 18, fontWeight: 900, color: m.color, lineHeight: 1 }}>
          {m.label}
        </span>
      </div>

      {/* MITAD 2 — readout up/down */}
      <div style={{ display: "flex", gap: 12, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: "#2EE59D" }}>{stats.up}↑</span>
        <span style={{ color: "#FF6B6B" }}>{stats.down}↓</span>
        <span style={{ opacity: 0.55 }}>{stats.flat}→</span>
        <span style={{ opacity: 0.45, marginLeft: "auto" }}>of {stats.total}</span>
      </div>

      {stats.topSymbol ? (
        <div style={{ fontSize: 11, opacity: 0.55 }}>
          led by <b style={{ opacity: 0.85 }}>{stats.topSymbol}</b>
        </div>
      ) : null}
    </div>
  );
}