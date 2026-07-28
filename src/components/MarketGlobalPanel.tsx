"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";


/**
 * MarketGlobalPanel — macro del mercado entero (va en la sección Prices, arriba).
 *
 * Muestra el mercado como un todo: market cap total + 24h, volumen total + 24h,
 * y la dominancia (barra apilada visual). Contexto macro antes del detalle por
 * activo (Watchlist / Top Movers). Datos keyless de CoinGecko /global.
 *
 * Honestidad: la dominancia es un hecho reportado por CoinGecko, no una
 * recomendación. Muestra cualquier activo que reporte (incl. desconocidos).
 */

// colores por símbolo para la barra de dominancia (los demás caen a "otros")
type GlobalDominance = { symbol: string; pct: number };

type GlobalMarket = {
  marketCapUsd: number | null;
  marketCapChange24h: number | null;   // % cambio 24h del market cap total
  volumeUsd: number | null;
  volumeChange24h: number | null;       // % cambio 24h del volumen total
  dominance: GlobalDominance[];         // top por dominancia (BTC, ETH, ...)
  activeCryptos: number | null;
  markets: number | null;
  ts: string;
};

const DOM_COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  USDT: "#26a17b",
  BNB: "#f3ba2f",
  USDC: "#2775ca",
  XRP: "#23292f",
  SOL: "#14f195",
  TRX: "#ff060a",
  FIGR_HELOC: "#fF069a",
};
const OTHER_COLOR = "rgba(255,255,255,0.22)";

function fmtBig(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return (v > 0 ? "+" : "") + v.toFixed(2) + "%";
}

function tone(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "rgba(255,255,255,0.6)";
  if (v > 0) return UI.green;
  if (v < 0) return UI.red;
  return "rgba(255,255,255,0.85)";
}

function Metric({ label, value, change }: { label: string; value: string; change?: number | null }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: UI.radiusLg,
        border: `1px solid ${UI.border}`,
        background: "rgba(255,255,255,0.04)",
        display: "grid",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {change !== undefined ? (
        <div style={{ fontSize: 13, fontWeight: 800, color: tone(change ?? null) }}>
          {fmtPct(change ?? null)} <span style={{ fontSize: 10, opacity: 0.6 }}>24h</span>
        </div>
      ) : null}
    </div>
  );
}

function DominanceBar({ dominance }: { dominance: GlobalDominance[] }) {
  // top 6 explícitos + "otros" agregado
  const top = dominance.slice(0, 9);
  const topSum = top.reduce((a, d) => a + d.pct, 0);
  const others = Math.max(0, 100 - topSum);

  const segments = [
    ...top.map((d) => ({ symbol: d.symbol, pct: d.pct, color: DOM_COLORS[d.symbol] ?? OTHER_COLOR })),
    ...(others > 0.5 ? [{ symbol: "Others", pct: others, color: OTHER_COLOR }] : []),
  ];

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.3 }}>
        Market dominance
      </div>

      {/* barra apilada */}
      <div style={{ display: "flex", height: 16, borderRadius: 999, overflow: "hidden", border: `1px solid ${UI.border}` }}>
        {segments.map((s) => (
          <div
            key={s.symbol}
            title={`${s.symbol} ${s.pct.toFixed(2)}%`}
            style={{ width: `${s.pct}%`, background: s.color, transition: "width 300ms ease" }}
          />
        ))}
      </div>

      {/* leyenda */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {segments.map((s) => (
          <div key={s.symbol} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 800 }}>{s.symbol}</span>
            <span style={{ opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketGlobalPanel() {
  const [data, setData] = useState<GlobalMarket | null>(null);
  const [ok, setOk] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/social/global");
        const j = await res.json();
        if (cancelled) return;
        setOk(!!j?.ok);
        setData(j?.data ?? null);
      } catch {
        if (!cancelled) setOk(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // ventana ~10min en la fuente; refrescar cada 10min y pausar si oculto
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 600_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <section
      style={{
        padding: 18,
        border: `1px solid ${UI.border}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
        minWidth: 0,
        overflow: "hidden",
        display: "grid",
        gap: 16,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 20 }}>
          Market <span style={{ color: UI.orange }}>Global</span>
        </h2>
        <p style={{ marginTop: 4, opacity: 0.7, fontSize: 13 }}>
          The whole market at a glance · CoinGecko
        </p>
      </div>

      {!ok ? (
        <div style={{ fontSize: 13, color: UI.red, opacity: 0.9 }}>⚠ Global market data unavailable.</div>
      ) : loading || !data ? (
        <div style={{ fontSize: 13, opacity: 0.6 }}>Loading global market…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <Metric label="Total market cap" value={fmtBig(data.marketCapUsd)} change={data.marketCapChange24h} />
            <Metric label="Total volume 24h" value={fmtBig(data.volumeUsd)} change={data.volumeChange24h} />
            <Metric label="Active cryptos" value={data.activeCryptos?.toLocaleString("en-US") ?? "—"} />
            <Metric label="Markets" value={data.markets?.toLocaleString("en-US") ?? "—"} />
          </div>

          <DominanceBar dominance={data.dominance} />
        </>
      )}
    </section>
  );
}
