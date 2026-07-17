"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import type { TrendingCoin } from "@/lib/types";

/**
 * TrendingNow — gancho de Overview.
 *
 * Qué es: lo que CoinGecko reporta como trending POR VOLUMEN DE BÚSQUEDA.
 * No es ranking propio, no es recomendación, no está filtrado a los símbolos
 * del portal. Por eso aparecen monedas desconocidas: ese es el dato.
 *
 * Honestidad de diseño:
 *  - Etiqueta visible de la fuente ("by search volume · not a recommendation").
 *  - market_cap_rank por card: contexto para distinguir un major de un token
 *    diminuto/nuevo. Rank #2 y rank #2000 se leen muy distinto.
 *  - Si el BFF falla -> "unavailable". Nunca datos fabricados.
 *
 * Muestra 15 y despliega el resto con "View all".
 */

const VISIBLE_DEFAULT = 15;

function fmtPrice(v: number | null) {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v > 0 && v < 0.01) return "$" + v.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
  if (v < 1) return "$" + v.toFixed(4);
  if (v < 1000) return "$" + v.toFixed(2);
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(v: number | null) {
  if (v == null || !Number.isFinite(v)) return "—";
  return (v > 0 ? "+" : "") + v.toFixed(2) + "%";
}

function tone(v: number | null) {
  if (v == null || !Number.isFinite(v)) return "rgba(255,255,255,0.6)";
  if (v > 0) return UI.green;
  if (v < 0) return UI.red;
  return "rgba(255,255,255,0.85)";
}

/** Rank como contexto honesto, no como jerarquía del portal. */
function RankChip({ rank }: { rank: number | null }) {
  const unranked = rank == null;
  const small = !unranked && rank! > 250;
  const c = unranked || small ? "rgba(255,255,255,0.55)" : UI.orangeSoft;
  const b = unranked || small ? UI.border : "rgba(255,159,67,0.22)";
  const bg = unranked || small ? "rgba(255,255,255,0.04)" : "rgba(255,159,67,0.10)";
  return (
    <span
      title={unranked ? "No market cap rank — very new or very small" : `Market cap rank #${rank}`}
      style={{
        padding: "2px 7px",
        borderRadius: 999,
        border: `1px solid ${b}`,
        background: bg,
        color: c,
        fontSize: 10,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {unranked ? "unranked" : `#${rank}`}
    </span>
  );
}

function TrendingCard({ c }: { c: TrendingCoin }) {
  const [open, setOpen] = useState(false);
  const t = tone(c.change24h);

  return (
    <div
      style={{
        padding: 12,
        borderRadius: UI.radiusLg,
        border: `1px solid ${UI.border}`,
        background: "rgba(255,255,255,0.045)",
        display: "grid",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt={c.symbol} width={26} height={26} style={{ borderRadius: "50%", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ fontWeight: 950, fontSize: 14 }}>{c.symbol}</span>
            <RankChip rank={c.rank} />
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {c.name}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{fmtPrice(c.price)}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: t, fontVariantNumeric: "tabular-nums" }}>
          {fmtPct(c.change24h)} <span style={{ fontSize: 10, opacity: 0.6 }}>24h</span>
        </span>
      </div>

      {/* sparkline: SVG que CoinGecko ya provee (no lo generamos nosotros) */}
      {c.sparkline ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.sparkline}
          alt=""
          aria-hidden
          style={{ width: "100%", height: "auto", display: "block", opacity: 0.85 }}
        />
      ) : (
        <div style={{ height: 34 }} />
      )}

      {c.description ? (
        <div>
          <div
            style={{
              fontSize: 11,
              lineHeight: 1.45,
              color: "rgba(230,237,243,0.62)",
              display: "-webkit-box",
              WebkitLineClamp: open ? 99 : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {c.description}
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              all: "unset",
              cursor: "pointer",
              marginTop: 4,
              fontSize: 10,
              fontWeight: 800,
              color: UI.orangeSoft,
            }}
          >
            {open ? "less" : "more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function TrendingNow() {
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [ok, setOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/social/trending");
        const j = await res.json();
        if (cancelled) return;
        setOk(!!j?.ok);
        setCoins(Array.isArray(j?.coins) ? j.coins : []);
      } catch {
        if (!cancelled) setOk(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // el BFF cachea 10 min; refrescar cada 10 min basta
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 600_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const visible = showAll ? coins : coins.slice(0, VISIBLE_DEFAULT);

  return (
    <section
      style={{
        marginTop: UI.gap,
        padding: 18,
        border: `1px solid ${UI.border}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>
            Trending <span style={{ color: UI.orange }}>Now</span>
          </h2>
          <p style={{ marginTop: 6, opacity: 0.78, fontSize: 14 }}>
            What the market is looking up right now.
          </p>
          {/* etiqueta honesta: es un hecho (esto se busca), no una recomendación */}
          <p style={{ marginTop: 4, fontSize: 11, opacity: 0.5 }}>
            Trending on CoinGecko · ranked by search volume · not a recommendation · unfiltered
          </p>
        </div>
        {coins.length ? (
          <span
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
            {coins.length} trending
          </span>
        ) : null}
      </div>

      {!ok ? (
        <div style={{ marginTop: 14, fontSize: 13, color: UI.red, opacity: 0.9 }}>
          ⚠ Trending data unavailable.
        </div>
      ) : loading ? (
        <div style={{ marginTop: 14, fontSize: 13, opacity: 0.6 }}>Loading trending…</div>
      ) : (
        <>
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 10,
            }}
          >
            {visible.map((c) => (
              <TrendingCard key={c.id} c={c} />
            ))}
          </div>

          {coins.length > VISIBLE_DEFAULT ? (
            <button
              onClick={() => setShowAll((v) => !v)}
              style={{
                all: "unset",
                cursor: "pointer",
                marginTop: 14,
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "10px 0",
                borderRadius: UI.radius,
                border: `1px solid rgba(255,159,67,0.30)`,
                color: UI.orangeSoft,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {showAll ? "Show less" : `View all (${coins.length})`}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
