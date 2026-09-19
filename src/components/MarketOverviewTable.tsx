"use client";

import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";
import Sparkline from "@/components/Sparkline";
import SymbolCell from "@/components/SymbolCell";
import { getFiat } from "@/lib/fiatStore";

type OverviewItem = {
  rank: number;
  symbol: string;
  price: number;
  change24h: number | null;
  change7d: number | null;
  volume24h: number | null;
  marketCap: number | null;
  spark: number[];
};

// formato de números grandes (mcap, volume) → $1.64T, $322.8B, $28.4M
function fmtBig(n?: number | null) {
  if (n == null || n === 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

// precio: decimales según magnitud (BTC $81,788 vs PEPE $0.00000392)
function fmtPrice(n?: number | null) {
  if (n == null) return "—";
  if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(3)}`;   // muy pequeños: 3 cifras significativas
}

function fmtPct(n?: number | null) {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function pctColor(n?: number | null) {
  if (n == null) return "rgba(255,255,255,0.4)";
  return n > 0 ? UI.green : n < 0 ? UI.red : "rgba(255,255,255,0.6)";
}

// tono del sparkline según el 7d (verde si sube, rojo si baja)
function sparkTone(change7d?: number | null): { stroke: string; fill: string } {
  if (change7d == null || change7d === 0)
    return { stroke: "rgba(255,255,255,0.4)", fill: "rgba(255,255,255,0.06)" };
  return change7d > 0
    ? { stroke: UI.green, fill: "rgba(46,229,157,0.10)" }
    : { stroke: UI.red, fill: "rgba(255,107,107,0.10)" };
}

export default function MarketOverviewTable({ fiat: fiatProp }: { fiat?: string } = {}) {
  const [items, setItems] = useState<OverviewItem[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError("");
        const fiat = fiatProp ?? getFiat();
        const res = await fetch(`/api/cryptolink/overview?fiat=${encodeURIComponent(fiat)}`, {
          headers: { accept: "application/json" },
        });
        const json = await res.json();
        if (!cancelled) {
          if (json?.ok) { setItems(json.items ?? []); setStatus("live"); }
          else setError(json?.error ?? "unknown");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "unknown");
      }
    }
    load();
    const id = setInterval(load, 60000);   // data horaria, refresco tranquilo
    const onFiat = () => load();
    window.addEventListener("cryptolink:fiat" as any, onFiat);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("cryptolink:fiat" as any, onFiat);
    };
  }, [fiatProp]);

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
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>
            Market <span style={{ color: UI.orange }}>Overview</span>
          </h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Top 100 by market cap · price, 24h / 7d change and 7-day trend.
          </p>
        </div>
        <DataStatusBadge status={status} />
      </div>

      {error ? (
        <p style={{ marginTop: 12 }}>Cannot load overview: <b>{error}</b></p>
      ) : (
        <div style={{ marginTop: 14, overflowX: "auto", maxWidth: "100%" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${UI.border}` }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Coin</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Price</th>
                <th style={{ ...thStyle, textAlign: "right" }}>24h</th>
                <th style={{ ...thStyle, textAlign: "right" }}>7d</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Volume 24h</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Market Cap</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Last 7 Days</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const tone = sparkTone(it.change7d);
                return (
                  <tr key={it.symbol} style={{ borderBottom: `1px solid ${UI.borderSoft}` }}>
                    <td style={{ ...tdStyle, opacity: 0.6 }}>{it.rank}</td>
                    <td style={tdStyle}><SymbolCell symbol={it.symbol} showName /></td>
                    <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                      {fmtPrice(it.price)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", color: pctColor(it.change24h), fontWeight: 700 }}>
                      {fmtPct(it.change24h)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", color: pctColor(it.change7d), fontWeight: 700 }}>
                      {fmtPct(it.change7d)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", opacity: 0.85 }}>
                      {fmtBig(it.volume24h)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums", opacity: 0.85 }}>
                      {fmtBig(it.marketCap)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div style={{ display: "inline-flex", justifyContent: "flex-end" }}>
                        <Sparkline values={it.spark} w={96} h={26} stroke={tone.stroke} fill={tone.fill} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && !error && (
                <tr><td colSpan={8} style={{ ...tdStyle, opacity: 0.7 }}>Loading top 100…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 10px", fontSize: 12, opacity: 0.7, fontWeight: 800, whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "12px 10px", fontSize: 13, whiteSpace: "nowrap",
};