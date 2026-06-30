"use client";

import { useEffect, useMemo, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchMomentum } from "@/lib/cryptoLink";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import DataStatusBadge from "./DataStatusBadge";
import { getTrendHistory } from "@/lib/useTrendHistory";
import { getSymbols } from "@/lib/symbolsStore";
import SymbolCell from "@/components/SymbolCell";
import { getSymbolName } from "@/lib/symbolMeta";
import { pushTrendHistory } from "@/lib/useTrendHistory";

/**
 * MarketMomentumPanel
 * Fusión de los antiguos MomentumPanel + TrendsPanel.
 * - Fuente ÚNICA: fetchMomentum (un solo fetch, un solo reloj → sin parpadeo LIVE/REFRESHING).
 * - Héroe de cada card: score. Soporte: dirección + strength + fluctuación.
 * - Una sola gráfica comparativa abajo (líder resaltado), NO sparkline por card
 *   (evita redundancia con los sparklines de Overview).
 * - topN parametrizado: hoy 5; el día de los tiers de suscripción se pasa topN={isPro ? 60 : 5}
 *   desde arriba, sin tocar este componente.
 *
 * PENDIENTE DOCUMENTADO — `reason`:
 *   El texto explicativo por activo vivía en el viejo TrendsPanel, alimentado por
 *   fetchTrends (socialLink) = una SEGUNDA fuente. Se deja fuera a propósito para no
 *   mantener dos fetches desincronizados. Revivir SOLO cuando el backend de Momentum
 *   incluya `reason` en su propio payload (entonces es gratis, sin segundo fetch).
 */

type MomentumItem = {
  symbol: string;
  direction: "up" | "down" | "flat";
  changePct: number;
  strength: "low" | "medium" | "high";
  score: number;
  last: number | null;
  source: string;
};

type MomentumResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  momentum: MomentumItem[];
};

function dirTone(direction: string) {
  if (direction === "up") return "#2BFF88";
  if (direction === "down") return "#FF6B6B";
  return "rgba(255,255,255,0.92)";
}

function dirLabel(direction: string) {
  if (direction === "up") return "Up";
  if (direction === "down") return "Down";
  return "Neutral";
}

function dirArrow(direction: string) {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  return "·";
}

function strengthLabel(strength: string) {
  if (strength === "high") return "High";
  if (strength === "medium") return "Medium";
  return "Low";
}

function fmtTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* ----------------------------------------------------------------
   Gráfica comparativa: solo el líder (mayor score) va resaltado;
   el resto queda tenue de fondo. Reusa getTrendHistory (sin buffer nuevo).
   Maneja el caso "serie con <2 puntos" sin romperse.
------------------------------------------------------------------ */
function MomentumLeaderChart({ items }: { items: MomentumItem[] }) {
  const w = 560;
  const h = 120;
  const padX = 10;
  const padY = 14;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const series = items.map((it) => ({
    symbol: it.symbol,
    direction: it.direction,
    score: it.score,
    values: getTrendHistory(it.symbol).slice(-24),
  }));

  // Solo se dibujan series con al menos 2 puntos de historia.
  const drawable = series.filter((s) => s.values.length >= 2);

  const allVals = drawable.flatMap((s) => s.values);
  const min = allVals.length ? Math.min(...allVals) : 0;
  const max = allVals.length ? Math.max(...allVals) : 1;
  const span = max - min || 1;

  const maxLen = drawable.reduce((m, s) => Math.max(m, s.values.length), 0);
  const step = maxLen > 1 ? innerW / (maxLen - 1) : innerW;

  const leaderSymbol = items[0]?.symbol; // items ya viene ordenado por score desc

  function pathFor(values: number[]) {
    const L = values.length;
    return values
      .map((v, i) => {
        // alineado a la derecha: el último punto toca el borde derecho ("ahora")
        const x = padX + (innerW - (L - 1 - i) * step);
        const y = padY + innerH - ((v - min) / span) * innerH;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

  if (!drawable.length) {
    return (
      <div
        style={{
          height: h,
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          opacity: 0.5,
        }}
      >
        Building comparison… waiting for history
      </div>
    );
  }

  const leader = drawable.find((s) => s.symbol === leaderSymbol);
  const others = drawable.filter((s) => s.symbol !== leaderSymbol);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* no-líderes: tenues PERO con tono según dirección (verde sube / rojo baja).
    Siguen de soporte: opacidad baja, sin glow. El líder es el único brillante. */}
    {others.map((s) => {
      const tenueStroke =
        s.direction === "up"
          ? "rgba(52,211,153,0.34)"   // verde tenue
          : s.direction === "down"
          ? "rgba(251,113,133,0.34)"  // rojo tenue
          : "rgba(255,255,255,0.20)"; // flat: gris tenue
      return (
        <path
          key={s.symbol}
          d={pathFor(s.values)}
          fill="none"
          stroke={tenueStroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    })}

      {/* líder: vivo, encima, con etiqueta */}
      {leader
        ? (() => {
            const tone = dirTone(leader.direction);
            const lastVal = leader.values[leader.values.length - 1];
            const lx = padX + innerW;
            const ly = padY + innerH - ((lastVal - min) / span) * innerH;
            const labelY = Math.max(14, ly - 8);
            return (
              <g>
                <path
                  d={pathFor(leader.values)}
                  fill="none"
                  stroke={tone}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 6px ${tone}55)` }}
                />
                <circle cx={lx} cy={ly} r="3" fill={tone} />
                <text
                  x={lx - 6}
                  y={labelY}
                  textAnchor="end"
                  fill={tone}
                  fontSize="12"
                  fontWeight="800"
                >
                  {leader.symbol}
                </text>
              </g>
            );
          })()
        : null}
    </svg>
  );
}

export default function MarketMomentumPanel({ topN = 10 }: { topN?: number}) {
  const storedMomentum = useMarketSignalsStore((s) => s.momentum);
  const setMomentumStore = useMarketSignalsStore((s) => s.setMomentum);

  const [data, setData] = useState<MomentumResponse | null>(storedMomentum);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">(
    storedMomentum ? "restored" : "refreshing"
  );

    useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        if (!cancelled) setStatus((prev) => (prev === "live" ? "refreshing" : prev));

        // símbolos activos del portal (fallback a majors si está vacío)
        const list = getSymbols();
        const symbols = list.length ? list : ["BTC", "ETH", "SOL"];

        const res = await fetchMomentum(symbols);

        if (!cancelled) {
          setData(res);
          setMomentumStore(res);
          setStatus("live");

          // auto-alimentar el historial que MomentumLeaderChart grafica
          // (antes lo llenaba useTrendsFeed; ahora Momentum es autónomo)
          for (const m of res.momentum ?? []) {
            if (typeof m.score === "number") {
              pushTrendHistory(m.symbol, m.score, 120);
            }
          }
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


  const top = useMemo(() => {
    const listed = data?.momentum ?? [];
    return [...listed]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topN);
  }, [data, topN]);

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
        <h2 style={{ margin: 0 }}>
          Market <span style={{ color: UI.orange }}>Momentum</span>
        </h2>
        <p style={{ marginTop: 8 }}>
          Cannot connect to momentum: <b>{error}</b>
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
        <h2 style={{ margin: 0 }}>
          Market <span style={{ color: UI.orange }}>Momentum</span>
        </h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Loading momentum...</p>
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: 20,
        padding: 16,
        border: `1px solid ${UI.border}`,
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
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
          <h2 style={{ margin: 0, fontSize: 20 }}>
            Market <span style={{ color: UI.orange }}>Momentum</span>
          </h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 13 }}>
            Direction, strength and derived score — top {topN} by score.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
            Updated · <code>{fmtTime(data.ts)}</code>
          </div>
        </div>
      </div>

      {/* CARDS — top N, compactas, héroe = score */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 10,
          marginTop: 14,
        }}
      >
        {top.map((m) => {
          const tone = dirTone(m.direction);
          const fullName = getSymbolName(m.symbol);
          return (
            <div
              key={m.symbol}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <SymbolCell symbol={m.symbol} />
                <div
                  style={{
                    fontSize: 11,
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: `1px solid ${UI.border}`,
                    background: "rgba(255,255,255,0.05)",
                    color: tone,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {dirArrow(m.direction)} {dirLabel(m.direction)}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                          {fullName ? (
                            <div className="hidden sm:block text-[13px] text-white/45 truncate">
                              {fullName}
                            </div>
                          ) : null}
                        </div>

              {/* HÉROE: score */}
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: tone,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {m.score.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Momentum score</div>

              {/* SOPORTE: strength + fluctuación */}
              <div
                style={{
                  marginTop: 2,
                  paddingTop: 8,
                  borderTop: `1px solid rgba(255,255,255,0.08)`,
                  fontSize: 12,
                  opacity: 0.8,
                  whiteSpace: "nowrap",
                }}
              >
                {strengthLabel(m.strength)} · {m.changePct.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* GRÁFICA ÚNICA — comparativa, líder resaltado */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 14,
          border: `1px solid ${UI.border}`,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.72 }}>Score comparison</div>
          <div style={{ fontSize: 11, opacity: 0.5 }}>
            leader: {top[0]?.symbol ?? "—"}
          </div>
        </div>
        <MomentumLeaderChart items={top} />
      </div>
    </section>
  );
}
