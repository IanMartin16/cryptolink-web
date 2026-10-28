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

const PAGE_SIZE = 100; // 200 expuestos => 2 páginas; sube cuando crezca el techo

function fmtBig(n?: number | null) {
  if (n == null || n === 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPrice(n?: number | null) {
  if (n == null) return "—";
  if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toPrecision(3)}`;
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

function sparkTone(change7d?: number | null): { stroke: string; fill: string } {
  if (change7d == null || change7d === 0)
    return { stroke: "rgba(255,255,255,0.4)", fill: "rgba(255,255,255,0.06)" };
  return change7d > 0
    ? { stroke: UI.green, fill: "rgba(46,229,157,0.10)" }
    : { stroke: UI.red, fill: "rgba(255,107,107,0.10)" };
}

// edad del dato -> etiqueta honesta ("actualizado hace Xm")
function fmtAge(iso?: string | null) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  const m = Math.floor(ms / 60000);
  if (m < 1) return "hace <1 min";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
}

export default function MarketOverviewTable({ fiat: fiatProp }: { fiat?: string } = {}) {
  const [items, setItems] = useState<OverviewItem[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setError("");
        setStatus("refreshing");
        const fiat = fiatProp ?? getFiat();
        const res = await fetch(
          `/api/cryptolink/overview?fiat=${encodeURIComponent(fiat)}&page=${page}&limit=${PAGE_SIZE}`,
          { headers: { accept: "application/json" } }
        );
        const json = await res.json();
        if (!cancelled) {
          if (json?.ok) {
            setItems(json.items ?? []);
            setTotalPages(json.totalPages ?? 1);
            setTotal(json.total ?? 0);
            setUpdatedAt(json.updatedAt ?? null);
            setStatus("live");
          } else setError(json?.error ?? "unknown");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "unknown");
      }
    }
    load();
    const id = setInterval(load, 60000);   // data horaria, refresco tranquilo de la página actual
    const onFiat = () => { setPage(1); load(); };
    window.addEventListener("cryptolink:fiat" as any, onFiat);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("cryptolink:fiat" as any, onFiat);
    };
  }, [fiatProp, page]);

  const age = fmtAge(updatedAt);

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
            Top {total || "—"} by market cap · price, 24h / 7d change and 7-day trend.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <DataStatusBadge status={status} />
          {age && (
            <span style={{ fontSize: 11, opacity: 0.6, whiteSpace: "nowrap" }}>
              Datos actualizados {age}
            </span>
          )}
        </div>
      </div>

      {error ? (
        <p style={{ marginTop: 12 }}>Cannot load overview: <b>{error}</b></p>
      ) : (
        <>
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
                  <tr><td colSpan={8} style={{ ...tdStyle, opacity: 0.7 }}>Loading…</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 16 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={pagerBtn(page <= 1)}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: 13, opacity: 0.75, fontVariantNumeric: "tabular-nums" }}>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={pagerBtn(page >= totalPages)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
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
function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: disabled ? "rgba(255,255,255,0.35)" : UI.text ?? "#fff",
    background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
    border: `1px solid ${UI.border}`,
    borderRadius: 10,
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
  };
}
