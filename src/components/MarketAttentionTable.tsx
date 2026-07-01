"use client";

import { useState } from "react";
import { UI } from "@/lib/ui";
import { Skeleton } from "@/components/Skeleton";
import Toast from "@/components/Toast";
import Sparkline from "@/components/Sparkline";
import SymbolCell from "@/components/SymbolCell";
import { getSymbolName } from "@/lib/symbolMeta";
import { getTrendHistory } from "@/lib/useTrendHistory";
import {
  useMarketAttention,
  type AttentionRow,
  type AttentionHealth,
} from "@/lib/useMarketAttention";

/* ============================ Fear & Greed gauge ============================ */

function fgZone(v: number) {
  if (v <= 24) return { label: "Extreme Fear", color: "#FF5247" };
  if (v <= 44) return { label: "Fear", color: "#FF8A3D" };
  if (v <= 55) return { label: "Neutral", color: "#E7C24A" };
  if (v <= 75) return { label: "Greed", color: "#7FD98A" };
  return { label: "Extreme Greed", color: "#2EE59D" };
}

function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  const zone = fgZone(v);

  // semicírculo: 180° mapeado de 0..100. Aguja apunta al valor.
  const angle = -90 + (v / 100) * 180; // -90 (izq) .. +90 (der)
  const cx = 80;
  const cy = 78;
  const r = 62;

  // arco de zonas (segmentos de color)
  const zones = [
    { from: 0, to: 24, color: "#FF5247" },
    { from: 24, to: 44, color: "#FF8A3D" },
    { from: 44, to: 55, color: "#E7C24A" },
    { from: 55, to: 75, color: "#7FD98A" },
    { from: 75, to: 100, color: "#2EE59D" },
  ];

  function polar(pct: number, radius: number) {
    const a = (-90 + (pct / 100) * 180) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }

  function arcPath(from: number, to: number, radius: number) {
    const s = polar(from, radius);
    const e = polar(to, radius);
    const large = to - from > 50 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const needle = polar(v, r - 14);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 16,
        border: `1px solid ${UI.border}`,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <svg width="160" height="92" viewBox="0 0 160 92">
        {zones.map((z, i) => (
          <path
            key={i}
            d={arcPath(z.from, z.to, r)}
            fill="none"
            stroke={z.color}
            strokeWidth="10"
            strokeLinecap="butt"
            opacity={0.85}
          />
        ))}
        {/* aguja */}
        <line
          x1={cx}
          y1={cy}
          x2={needle.x}
          y2={needle.y}
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill="#fff" />
      </svg>

      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ fontSize: 11, opacity: 0.6 }}>Fear &amp; Greed</div>
        <div style={{ fontSize: 26, fontWeight: 950, color: zone.color, lineHeight: 1 }}>
          {v}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: zone.color }}>{zone.label}</div>
      </div>
    </div>
  );
}

/* ============================ Tag chips por categoría ============================ */

function tagTone(tag: string): { c: string; bg: string; b: string } {
  const t = tag.toLowerCase();
  // majors / store-of-value / smart-contracts -> naranja (marca)
  if (["majors-led", "store-of-value", "smart-contracts"].includes(t))
    return { c: UI.orangeSoft, bg: "rgba(255,159,67,0.10)", b: "rgba(255,159,67,0.25)" };
  // layer1 -> azul
  if (["layer1", "layer1 rotation"].includes(t))
    return { c: "#6FB7FF", bg: "rgba(111,183,255,0.10)", b: "rgba(111,183,255,0.25)" };
  // meme -> morado
  if (["meme", "meme-led"].includes(t))
    return { c: "#C08BFF", bg: "rgba(192,139,255,0.10)", b: "rgba(192,139,255,0.25)" };
  // defi -> verde
  if (t === "defi")
    return { c: UI.green, bg: "rgba(46,229,157,0.10)", b: "rgba(46,229,157,0.25)" };
  // señales de cautela -> rojo
  if (["risk-off", "weak major participation"].includes(t))
    return { c: UI.red, bg: "rgba(255,107,107,0.10)", b: "rgba(255,107,107,0.25)" };
  // narrativos / breadth -> neutro
  return { c: "rgba(255,255,255,0.78)", bg: "rgba(255,255,255,0.05)", b: UI.border };
}

function TagChip({ tag }: { tag: string }) {
  const t = tagTone(tag);
  return (
    <span
      style={{
        padding: "3px 9px",
        borderRadius: 999,
        border: `1px solid ${t.b}`,
        background: t.bg,
        color: t.c,
        fontSize: 11,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {tag}
    </span>
  );
}

/* ============================ Direction badge ============================ */

function dirColor(d: AttentionRow["direction"]) {
  return d === "up" ? UI.green : d === "down" ? UI.red : "#bbb";
}

function DirBadge({ d }: { d: AttentionRow["direction"] }) {
  const c = dirColor(d);
  const label = d === "up" ? "UP" : d === "down" ? "DOWN" : "FLAT";
  const bg =
    d === "up" ? "rgba(46,229,157,0.10)" : d === "down" ? "rgba(255,107,107,0.10)" : "rgba(255,255,255,0.06)";
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 999,
        border: `1px solid ${c === "#bbb" ? UI.border : c}`,
        color: c,
        background: bg,
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function fmtDelta(v: number) {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

/* ============================ Component ============================ */

export default function MarketAttentionTable({
  onHealth,
  onItems,
}: {
  onHealth?: (h: AttentionHealth) => void;
  onItems?: (rows: AttentionRow[]) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone?: "ok" | "warn" | "err" } | null>(null);

  const {
    viewRows,
    rows,
    fearGreed,
    coverage,
    ts,
    error,
    loading,
    refreshing,
    auto,
    setAuto,
    filter,
    setFilter,
    stats,
  } = useMarketAttention({ onHealth, onItems });

  const showSkeleton = loading && rows.length === 0;

  function shortTime(v?: string) {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function Chip({ children }: { children: React.ReactNode }) {
    return (
      <span
        style={{
          padding: "3px 8px",
          borderRadius: 999,
          border: `1px solid ${UI.border}`,
          background: "rgba(255,255,255,0.03)",
          fontSize: 11,
          fontWeight: 800,
          opacity: 0.9,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
    );
  }

  function ChipBtn({
    active,
    tone,
    onClick,
    children,
  }: {
    active: boolean;
    tone?: "up" | "down" | "neutral";
    onClick: () => void;
    children: React.ReactNode;
  }) {
    const c = tone === "up" ? UI.green : tone === "down" ? UI.red : "rgba(255,255,255,0.85)";
    return (
      <button
        onClick={onClick}
        style={{
          all: "unset",
          cursor: "pointer",
          padding: "4px 10px",
          borderRadius: 999,
          border: `1px solid ${active ? "rgba(255,159,67,0.45)" : UI.border}`,
          background: active ? "rgba(255,159,67,0.10)" : "rgba(255,255,255,0.03)",
          fontSize: 12,
          fontWeight: 950,
          color: active ? UI.orangeSoft : c,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <section
      style={{
        marginTop: UI.gap,
        padding: UI.padLg,
        border: `1px solid ${UI.border}`,
        borderRadius: UI.radiusLg,
        background:
          stats.mood === "BULLISH"
            ? "linear-gradient(180deg, rgba(46,229,157,0.06), rgba(255,255,255,0.02))"
            : stats.mood === "BEARISH"
            ? "linear-gradient(180deg, rgba(255,107,107,0.06), rgba(255,255,255,0.02))"
            : UI.panel,
        position: "relative",
        overflow: "hidden",
        minHeight: 300,
      }}
    >
      {refreshing && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(255,159,67,0.95), transparent)",
            animation: "clSweep 950ms ease-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>
            Market <span style={{ color: UI.orange }}>Attention</span>
          </h2>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.72, maxWidth: 520 }}>
            Top assets capturing market attention right now, with narrative tags.
          </div>
          <div style={{ marginTop: 6, fontSize: 11, opacity: 0.5 }}>
            Market-wide top · not filtered by your selection · window 1h
          </div>
        </div>

        {/* Fear & Greed gauge */}
        {fearGreed ? (
          <FearGreedGauge value={fearGreed.value} label={fearGreed.label} />
        ) : null}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Chip>
          Coverage: <span style={{ color: UI.orangeSoft }}>{coverage}</span>
        </Chip>
        <Chip>
          Updated: <span style={{ color: UI.orangeSoft }}>{shortTime(ts)}</span>
        </Chip>
        <Chip>
          Auto:{" "}
          <button
            onClick={() => setAuto((v) => !v)}
            style={{ all: "unset", cursor: "pointer", fontWeight: 950, color: auto ? UI.green : UI.red, marginLeft: 6 }}
          >
            {auto ? "ON" : "OFF"}
          </button>
        </Chip>
        <ChipBtn active={filter === "all"} tone="neutral" onClick={() => setFilter("all")}>ALL</ChipBtn>
        <ChipBtn active={filter === "up"} tone="up" onClick={() => setFilter("up")}>UP</ChipBtn>
        <ChipBtn active={filter === "down"} tone="down" onClick={() => setFilter("down")}>DOWN</ChipBtn>
      </div>

      {error && (
        <div style={{ marginTop: 10, color: UI.red, fontSize: 12 }}>
          ⚠ Attention data unavailable ({error}).
        </div>
      )}

      {showSkeleton ? (
        <div style={{ marginTop: 12 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ padding: "12px 8px", borderBottom: `1px solid ${UI.borderSoft}` }}>
              <Skeleton w={220} h={14} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 12, overflowX: "auto", maxHeight: 720 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${UI.border}`, position: "sticky", top: 0, background: UI.panel, zIndex: 1 }}>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>#</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Symbol</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Attention</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Dir</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Δ Att.</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Tags</th>
              </tr>
            </thead>
            <tbody>
              {viewRows.map((r, idx) => {
                const rank = idx + 1;
                const isHover = hover === r.symbol;
                const isTop = rank <= 3;
                const fullName = getSymbolName(r.symbol);
                const h = getTrendHistory(r.symbol).slice(-24);
                const c = dirColor(r.direction);

                const rankStyle = isTop
                  ? { background: "rgba(255,159,67,0.12)", border: `1px solid rgba(255,159,67,0.22)`, color: UI.orangeSoft }
                  : { background: "rgba(255,255,255,0.03)", border: `1px solid ${UI.border}`, color: "rgba(255,255,255,0.70)" };

                return (
                  <tr
                    key={r.symbol}
                    onMouseEnter={() => setHover(r.symbol)}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      borderBottom: `1px solid ${UI.borderSoft}`,
                      background: isHover ? "rgba(255,159,67,0.06)" : "transparent",
                      transition: "background 120ms ease",
                    }}
                  >
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ display: "inline-grid", placeItems: "center", width: 28, height: 22, borderRadius: 999, fontWeight: 950, fontSize: 12, ...rankStyle }}>
                        {rank}
                      </span>
                    </td>

                    <td style={{ padding: "12px 8px", fontWeight: 950 }}>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(r.symbol);
                            setToast({ msg: `Copied: ${r.symbol}`, tone: "ok" });
                          } catch {
                            setToast({ msg: "Couldn't copy.", tone: "err" });
                          }
                        }}
                        style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, color: "#e6edf3" }}
                        title="Copy symbol"
                      >
                        <SymbolCell symbol={r.symbol} />
                        {fullName ? <span className="hidden sm:inline" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{fullName}</span> : null}
                      </button>
                    </td>

                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <Sparkline
                          values={h}
                          w={82}
                          h={20}
                          stroke={c}
                          fill={r.direction === "up" ? "rgba(46,229,157,0.10)" : r.direction === "down" ? "rgba(255,107,107,0.10)" : "rgba(255,255,255,0.06)"}
                        />
                        <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 32 }}>
                          {r.attentionScore.toFixed(0)}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "12px 8px" }}>
                      <DirBadge d={r.direction} />
                    </td>

                    <td style={{ padding: "12px 8px", fontVariantNumeric: "tabular-nums", color: c, fontWeight: 800 }}>
                      {fmtDelta(r.attentionDeltaPct)}
                    </td>

                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {r.tags.length ? r.tags.map((t) => <TagChip key={t} tag={t} />) : <span style={{ opacity: 0.4, fontSize: 12 }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !error && (
                <tr>
                  <td colSpan={6} style={{ padding: "12px 8px", opacity: 0.75 }}>
                    No attention data yet…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Toast toast={toast} onClear={() => setToast(null)} />
    </section>
  );
}
