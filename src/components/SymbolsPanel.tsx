"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";
import { fetchSymbols360, type SymbolMarket, type SymbolsResponse } from "@/lib/cryptoLink";
import { getSymbols } from "@/lib/symbolsStore";

/**
 * SymbolsPanel — vista 360° por activo con datos ricos de CoinGecko.
 * Fuente: /api/social/symbols (motor Python social_link → CoinGecko /coins/markets).
 *
 * - Opción A: cuadrícula de fichas compactas, una por símbolo SELECCIONADO
 *   (coherente con Prices: solo muestra lo que el usuario eligió).
 * - Base condicional para Fase futura: cada ficha es candidata a "tappable"
 *   hacia un detalle profundo (los ~15 campos completos).
 * - Maneja: precios científicos (SHIB 4.71e-06), null (maxSupply de ETH/SOL),
 *   y missing (símbolo sin datos en CoinGecko → ficha "data unavailable").
 */

// ---------- formateadores ----------

function fmtPrice(v?: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  // precios muy pequeños (SHIB): evita notación científica, muestra decimales
  if (v > 0 && v < 0.01) {
    return "$" + v.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
  }
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

function fmtSupply(v?: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v >= 1e12) return (v / 1e12).toFixed(2) + "T";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(2) + "K";
  return v.toFixed(0);
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
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

// ---------- ficha individual ----------

function SymbolCard({ s }: { s: SymbolMarket }) {
  const tone = changeTone(s.change24h);

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        border: `1px solid ${UI.border}`,
        background: "rgba(255,255,255,0.045)",
        display: "grid",
        gap: 10,
        minWidth: 0,
      }}
    >
      {/* cabecera: logo + símbolo + nombre + rank */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {s.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.image}
            alt={s.symbol}
            width={28}
            height={28}
            style={{ borderRadius: "50%", flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 950, fontSize: 15 }}>{s.symbol}</span>
            {s.rank != null ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 6px",
                  borderRadius: 999,
                  background: "rgba(255,159,67,0.12)",
                  border: "1px solid rgba(255,159,67,0.22)",
                  color: UI.orange,
                  whiteSpace: "nowrap",
                }}
              >
                #{s.rank}
              </span>
            ) : null}
          </div>
          {s.name ? (
            <div
              style={{
                fontSize: 12,
                opacity: 0.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {s.name}
            </div>
          ) : null}
        </div>
      </div>

      {/* precio + change24h (héroe) */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
          {fmtPrice(s.price)}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: tone, fontVariantNumeric: "tabular-nums" }}>
          {fmtPct(s.change24h)}
        </span>
      </div>

      {/* rango día */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          opacity: 0.7,
          gap: 8,
        }}
      >
        <span>L: {fmtPrice(s.low24h)}</span>
        <span>H: {fmtPrice(s.high24h)}</span>
      </div>

      {/* tamaño: mcap + volumen */}
      <div
        style={{
          paddingTop: 8,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          fontSize: 12,
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

// ---------- ficha de símbolo sin datos (missing) ----------

function MissingCard({ symbol }: { symbol: string }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        border: `1px dashed ${UI.border}`,
        background: "rgba(255,255,255,0.02)",
        display: "grid",
        gap: 8,
        minWidth: 0,
        alignContent: "center",
        minHeight: 120,
      }}
    >
      <div style={{ fontWeight: 950, fontSize: 15, opacity: 0.8 }}>{symbol}</div>
      <div style={{ fontSize: 12, opacity: 0.5 }}>Market data unavailable</div>
    </div>
  );
}

// ---------- panel ----------

export default function SymbolsPanel() {
  const [data, setData] = useState<SymbolsResponse | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const list = getSymbols();
        const symbols = list.length ? list : ["BTC", "ETH", "SOL"];
        const res = await fetchSymbols360(symbols);
        if (!cancelled) {
          setData(res);
          setStatus("live");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "unknown");
      }
    }

    load();
    // CoinGecko cambia lento + free tier: refresco amplio (90s).
    // El BFF cachea, así que no golpea CoinGecko en cada visita.
    const id = setInterval(load, 90000);

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
          borderRadius: 18,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0 }}>Symbols <span style={{ color: UI.orange }}>360°</span></h2>
        <p style={{ marginTop: 8 }}>Cannot load market data: <b>{error}</b></p>
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
          borderRadius: 18,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0 }}>Symbols <span style={{ color: UI.orange }}>360°</span></h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Loading market data…</p>
      </section>
    );
  }

  const symbols = data.symbols ?? [];
  const missing = data.missing ?? [];

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
          <h2 style={{ margin: 0, fontSize: 22 }}>
            Symbols <span style={{ color: UI.orange }}>360°</span>
          </h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Rich market data per asset · price, market cap, volume and 24h range.
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
            Updated · <code>{fmtTs(data.ts)}</code>
          </div>
        </div>
      </div>

      {/* CUADRÍCULA DE FICHAS */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {symbols.map((s) => (
          <SymbolCard key={s.symbol} s={s} />
        ))}
        {missing.map((sym) => (
          <MissingCard key={`missing-${sym}`} symbol={sym} />
        ))}
      </div>

      {symbols.length === 0 && missing.length === 0 ? (
        <div style={{ marginTop: 14, opacity: 0.7, fontSize: 13 }}>
          No symbols selected. Choose assets in Settings.
        </div>
      ) : null}
    </section>
  );
}
