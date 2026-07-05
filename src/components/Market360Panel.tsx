"use client";

import { useEffect, useMemo, useState } from "react";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";
import { getFiat } from "@/lib/fiatStore";
import { getSymbols } from "@/lib/symbolsStore";
import { fetchSymbols360, type SymbolMarket, type SymbolsResponse } from "@/lib/cryptoLink";

/**
 * Market360Panel (antes SymbolsPanel) — sección "Market 360°".
 * Una sola fuente (fetchSymbols360) alimenta DOS vistas:
 *   1. MarketBubbles (panorámica) — arriba, el gancho visual.
 *   2. Fichas (detalle) — abajo.
 * Ambas visibles siempre (no toggle): los logs muestran que los usuarios se
 * enganchan con lo visual y no abrirían una vista escondida, perdiéndose los
 * datos ricos. Por eso el detalle no se esconde.
 *
 * Reactivo a cryptolink:fiat y cryptolink:symbols (contrato de panel del portal).
 */

// ---------- formateadores ----------

function fmtPrice(v?: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v > 0 && v < 0.01) return "$" + v.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
  if (v < 1) return "$" + v.toFixed(4);
  if (v < 1000) return "$" + v.toFixed(2);
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtCompact(v?: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(2) + "K";
  return "$" + v.toFixed(0);
}

function fmtPct(v?: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return sign + v.toFixed(2) + "%";
}

function changeTone(v?: number | null): string {
  if (v == null || !Number.isFinite(v)) return "rgba(255,255,255,0.6)";
  if (v > 0) return "#2BFF88";
  if (v < 0) return "#FF6B6B";
  return "rgba(255,255,255,0.85)";
}

function fmtTs(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
}

// =====================================================================
// VISTA 1 — MarketBubbles (panorámica). Recibe los symbols ya cargados.
// Eje X = change24h · Eje Y = volume24h · tamaño = marketCap.
// =====================================================================

function MarketBubbles({ symbols }: { symbols: SymbolMarket[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const MAX_BUBBLES = 10;

  // solo burbujas con las 3 dimensiones válidas
  const points = useMemo(
    () =>
      symbols
        .filter(
          (s) =>
            Number.isFinite(s.change24h as number) &&
            Number.isFinite(s.volume24h as number) &&
            Number.isFinite(s.marketCap as number)
        )
        .sort((a, b) => (b.marketCap as number) - (a.marketCap as number))
        .slice(0, MAX_BUBBLES),
    [symbols]
  );

  const W = 720;
  const H = 300;
  const padL = 64;
  const padR = 24;
  const padT = 24;
  const padB = 50;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const layout = useMemo(() => {
    if (!points.length) return null;

    const changes = points.map((d) => d.change24h as number);
    const maxAbs = Math.max(5, Math.ceil(Math.max(...changes.map(Math.abs))));
    const xMin = -maxAbs;
    const xMax = maxAbs;

    const vols = points.map((d) => d.volume24h as number);
    const yMax = Math.max(...vols) * 1.15 || 1;

    const caps = points.map((d) => d.marketCap as number);
    const capMax = Math.max(...caps);
    const capMin = Math.min(...caps);

    const xPos = (v: number) => padL + ((v - xMin) / (xMax - xMin)) * innerW;
    const yPos = (v: number) => padT + innerH - (v / yMax) * innerH;
    const rFor = (cap: number) => {
      const t =
        (Math.sqrt(cap) - Math.sqrt(capMin)) /
        (Math.sqrt(capMax) - Math.sqrt(capMin) || 1);
      return 10 + t * 40;
    };

    const bubbles = points
      .map((d) => ({
        ...d,
        cx: xPos(d.change24h as number),
        cy: yPos(d.volume24h as number),
        r: rFor(d.marketCap as number),
        tone: changeTone(d.change24h),
      }))
      .sort((a, b) => b.r - a.r);

    const xTicks: number[] = [];
    for (let v = xMin; v <= xMax; v += maxAbs / 2) xTicks.push(v);

    return { bubbles, xPos, yPos, yMax, xTicks, zeroX: xPos(0) };
  }, [points, innerW, innerH]);

  if (!layout) {
    return (
      <div style={{ height: 200, display: "grid", placeItems: "center", fontSize: 13, opacity: 0.5 }}>
        Not enough market data to plot bubbles yet.
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        {/* bandas de fondo: pierde / gana */}
        <rect x={padL} y={padT} width={layout.zeroX - padL} height={innerH} fill="rgba(255,107,107,0.04)" />
        <rect x={layout.zeroX} y={padT} width={padL + innerW - layout.zeroX} height={innerH} fill="rgba(43,255,136,0.04)" />

        {/* grid X */}
        {layout.xTicks.map((v, i) => {
          const x = layout.xPos(v);
          const isZero = Math.abs(v) < 0.001;
          return (
            <g key={i}>
              <line
                x1={x} y1={padT} x2={x} y2={padT + innerH}
                stroke={isZero ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)"}
                strokeWidth={isZero ? 1.5 : 1}
                strokeDasharray={isZero ? "none" : "3 4"}
              />
              <text x={x} y={padT + innerH + 18} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">
                {v > 0 ? "+" : ""}{v.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {/* grid Y (volumen) */}
        {[0, 0.5, 1].map((t, i) => {
          const y = padT + innerH - t * innerH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={padL - 10} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="11">
                {fmtCompact(layout.yMax * t)}
              </text>
            </g>
          );
        })}

        {/* etiquetas de ejes */}
        <text x={padL + innerW / 2} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="12" fontWeight="700">
          ← 24h change →
        </text>
        <text
          x={16} y={padT + innerH / 2} textAnchor="middle"
          fill="rgba(255,255,255,0.55)" fontSize="12" fontWeight="700"
          transform={`rotate(-90 16 ${padT + innerH / 2})`}
        >
          Volume 24h
        </text>

        {/* burbujas — flotación cosmética: el grupo oscila ~2-3px alrededor del
            centro REAL (cx,cy no cambian). Desfase por índice => orgánico, no robótico.
            El centro de datos no se mueve: la animación es solo visual. */}
        {layout.bubbles.map((b, i) => {
          const isHover = hover === b.symbol;
          // parámetros de flotación, ligeramente distintos por burbuja
          const dur = (4.2 + (i % 5) * 0.6).toFixed(2);   // 4.2s..6.6s
          const delay = ((i % 7) * -0.8).toFixed(2);       // desfase negativo
          return (
            <g
              key={b.symbol}
              onMouseEnter={() => setHover(b.symbol)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <g
                className="cl-bubble-float"
                style={{
                  // @ts-ignore (CSS custom props)
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  animationDuration: `${dur}s`,
                  animationDelay: `${delay}s`,
                  // pausar la flotación de la burbuja con hover (para leerla quieta)
                  animationPlayState: isHover ? "paused" : "running",
                }}
              >
                <circle
                  cx={b.cx} cy={b.cy} r={b.r}
                  fill={b.tone}
                  fillOpacity={isHover ? 0.32 : 0.16}
                  stroke={b.tone}
                  strokeWidth={isHover ? 2.5 : 1.5}
                  style={{ transition: "fill-opacity 150ms ease, stroke-width 150ms ease" }}
                />
                {(b.r > 22 || isHover) && (
                  <text
                    x={b.cx} y={b.cy + 4} textAnchor="middle"
                    fill="#fff" fontSize={b.r > 28 ? 12 : 10} fontWeight="900"
                    style={{ pointerEvents: "none" }}
                  >
                    {b.symbol}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      {/* tooltip */}
      {hover && (() => {
        const b = layout.bubbles.find((x) => x.symbol === hover);
        if (!b) return null;
        return (
          <div
            style={{
              position: "absolute",
              left: `${(b.cx / W) * 100}%`,
              top: `${(b.cy / H) * 100}%`,
              transform: "translate(-50%, calc(-100% - 12px))",
              background: "rgba(10,12,16,0.96)",
              border: `1px solid ${b.tone}`,
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 12,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 4 }}>{b.symbol}</div>
            <div style={{ color: b.tone, fontWeight: 800 }}>{fmtPct(b.change24h)} 24h</div>
            <div style={{ opacity: 0.8, marginTop: 2 }}>Vol: {fmtCompact(b.volume24h)}</div>
            <div style={{ opacity: 0.8 }}>Mkt Cap: {fmtCompact(b.marketCap)}</div>
          </div>
        );
      })()}

      {/* leyenda */}
      <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, opacity: 0.65 }}>
        <span>● size = market cap</span>
        <span style={{ color: "#2BFF88" }}>● gaining</span>
        <span style={{ color: "#FF6B6B" }}>● losing</span>
        <span style={{ opacity: 0.5 }}>top {MAX_BUBBLES} by market cap</span>
      </div>

      <style jsx>{`
        .cl-bubble-float {
          animation-name: clBubbleFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        @keyframes clBubbleFloat {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
        }
        /* Accesibilidad: sin movimiento si el usuario lo pide. Quietas, honestas. */
        @media (prefers-reduced-motion: reduce) {
          .cl-bubble-float {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

// =====================================================================
// VISTA 2 — Ficha de detalle
// =====================================================================

function SymbolCard({ s }: { s: SymbolMarket }) {
  const tone = changeTone(s.change24h);
  return (
    <div
      style={{
        padding: 14, borderRadius: 16, border: `1px solid ${UI.border}`,
        background: "rgba(255,255,255,0.045)", display: "grid", gap: 10, minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {s.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.image} alt={s.symbol} width={28} height={28} style={{ borderRadius: "50%", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 950, fontSize: 15 }}>{s.symbol}</span>
            {s.rank != null ? (
              <span
                style={{
                  fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 999,
                  background: "rgba(255,159,67,0.12)", border: "1px solid rgba(255,159,67,0.22)",
                  color: UI.orange, whiteSpace: "nowrap",
                }}
              >
                #{s.rank}
              </span>
            ) : null}
          </div>
          {s.name ? (
            <div style={{ fontSize: 12, opacity: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.name}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{fmtPrice(s.price)}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: tone, fontVariantNumeric: "tabular-nums" }}>{fmtPct(s.change24h)}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.7, gap: 8 }}>
        <span>L: {fmtPrice(s.low24h)}</span>
        <span>H: {fmtPrice(s.high24h)}</span>
      </div>

      <div
        style={{
          paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12,
        }}
      >
        <div>
          <div style={{ opacity: 0.55 }}>Mkt Cap</div>
          <div style={{ fontWeight: 700 }}>{fmtCompact(s.marketCap)}</div>
        </div>
        <div>
          <div style={{ opacity: 0.55 }}>Volume 24h</div>
          <div style={{ fontWeight: 700 }}>{fmtCompact(s.volume24h)}</div>
        </div>
      </div>
    </div>
  );
}

function MissingCard({ symbol }: { symbol: string }) {
  return (
    <div
      style={{
        padding: 14, borderRadius: 16, border: `1px dashed ${UI.border}`,
        background: "rgba(255,255,255,0.02)", display: "grid", gap: 8, minWidth: 0,
        alignContent: "center", minHeight: 120,
      }}
    >
      <div style={{ fontWeight: 950, fontSize: 15, opacity: 0.8 }}>{symbol}</div>
      <div style={{ fontSize: 12, opacity: 0.5 }}>Market data unavailable</div>
    </div>
  );
}

// =====================================================================
// PANEL
// =====================================================================

export default function Market360Panel() {
  const [data, setData] = useState<SymbolsResponse | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const fiat = getFiat();
        const list = getSymbols();
        const symbols = list.length ? list : ["BTC", "ETH", "SOL"];
        const res = await fetchSymbols360(symbols, fiat);
        if (!cancelled) {
          setData(res);
          setStatus("live");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "unknown");
      }
    }

    load();
    const id = setInterval(load, 300000); // 5 min (CoinGecko cambia lento; BFF cachea)

    const onFiat = () => load();
    const onSymbols = () => load();
    window.addEventListener("cryptolink:fiat" as any, onFiat);
    window.addEventListener("cryptolink:symbols" as any, onSymbols);

    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("cryptolink:fiat" as any, onFiat);
      window.removeEventListener("cryptolink:symbols" as any, onSymbols);
    };
  }, []);

  if (error) {
    return (
      <section style={{ marginTop: UI.gap, padding: 20, border: `1px solid ${UI.border}`, borderRadius: 18, background: UI.panel }}>
        <h2 style={{ margin: 0 }}>Market <span style={{ color: UI.orange }}>360°</span></h2>
        <p style={{ marginTop: 8 }}>Cannot load market data: <b>{error}</b></p>
      </section>
    );
  }

  if (!data) {
    return (
      <section style={{ marginTop: UI.gap, padding: 20, border: `1px solid ${UI.border}`, borderRadius: 18, background: UI.panel }}>
        <h2 style={{ margin: 0 }}>Market <span style={{ color: UI.orange }}>360°</span></h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Loading market data…</p>
      </section>
    );
  }

  const symbols = data.symbols ?? [];
  const missing = data.missing ?? [];

  return (
    <section
      style={{
        marginTop: UI.gap, padding: 18, border: `1px solid ${UI.border}`, borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)", minWidth: 0, overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Market <span style={{ color: UI.orange }}>360°</span></h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Activity vs performance, then full detail per asset.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DataStatusBadge status={status} />
          <div
            style={{
              padding: "6px 10px", borderRadius: 999, border: `1px solid ${UI.border}`,
              background: "rgba(255,255,255,0.05)", fontSize: 12, opacity: 0.82, whiteSpace: "nowrap",
            }}
          >
            Updated · <code>{fmtTs(data.ts)}</code>
          </div>
        </div>
      </div>

      {/* VISTA 1 — FICHAS (detalle, lo más valioso: van primero) */}
      <div
        style={{
          marginTop: 14, display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12,
        }}
      >
        {symbols.map((s) => (
          <SymbolCard key={s.symbol} s={s} />
        ))}
        {missing.map((sym) => (
          <MissingCard key={`missing-${sym}`} symbol={sym} />
        ))}
      </div>

      {/* VISTA 2 — BUBBLES (panorámica compacta, cierra la sección sin opacar las cards) */}
      <div
        style={{
          marginTop: 14, padding: 12, borderRadius: 16, border: `1px solid ${UI.border}`,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <MarketBubbles symbols={symbols} />
      </div>

      {symbols.length === 0 && missing.length === 0 ? (
        <div style={{ marginTop: 14, opacity: 0.7, fontSize: 13 }}>
          No symbols selected. Choose assets in Settings.
        </div>
      ) : null}
    </section>
  );
}
