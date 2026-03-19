"use client";

import { useState } from "react";
import { UI } from "@/lib/ui";
import { Skeleton } from "@/components/Skeleton";
import Toast from "@/components/Toast";
import SymbolCell from "@/components/SymbolCell";
import type { Health } from "@/lib/health";
import type { PriceRow } from "@/lib/types";
import { usePricesFeed } from "@/lib/hooks/usePricesFeed";

// CacheBadge inline.
function CacheBadge({ v }: { v?: string }) {
  const val = (v ?? "MISS").toUpperCase();

  const isHit = val === "CACHE" || val === "HIT";
  const isLive = val === "LIVE";

  const s = isHit
    ? { bg: "rgba(46,229,157,0.10)", c: UI.green, b: "rgba(46,229,157,0.25)", dot: UI.green, label: "HIT" }
    : isLive
    ? { bg: "rgba(255,159,67,0.10)", c: UI.orangeSoft, b: "rgba(255,159,67,0.20)", dot: UI.orangeSoft, label: "LIVE" }
    : { bg: "rgba(255,255,255,0.06)", c: "#bbb", b: "rgba(255,255,255,0.10)", dot: "#bbb", label: "MISS" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        background: s.bg,
        color: s.c,
        border: `1px solid ${s.b}`,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: s.dot,
          boxShadow: `0 0 10px ${s.dot}33`,
        }}
      />
      {s.label}
    </span>
  );
}

function RefreshDot({ on }: { on: boolean }) {
    return (
      <span
        title={on ? "Updating" : "Idle"}
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          display: "inline-block",
          background: on ? "rgba(255,159,67,0.95)" : "rgba(255,255,255,0.18)",
          boxShadow: on ? "0 0 14px rgba(255,159,67,0.35)" : "none",
          animation: on ? "clPulse 900ms ease-in-out infinite" : "none",
        }}
      />
    );
  }

export default function PricesPanel({
  onRows,
  onHealth,
}: {
  onRows?: (rows: PriceRow[]) => void;
  onHealth?: (h: Health) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone?: "ok" | "warn" | "err" } | null>(null);

  const {
    rows,
    error,
    loading,
    updatingFiat,
    refreshing,
    auto,
    setAuto,
    lastUpdated,
    symbolsCount,
    fiatLabel,
    flashRow,
  } = usePricesFeed({ onRows, onHealth });

  const showSkeleton = loading && rows.length === 0;

  function copySymbol(sym: string) {
    navigator.clipboard.writeText(sym);
    setCopied(sym);
    setTimeout(() => setCopied(null), 1200);
  }

  function shortTime(v?: string) {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatCompactMarketCap(value?: number) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";

    const abs = Math.abs(value);

    if (abs >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;

    return value.toFixed(0);
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

  return (
    <section
      style={{
        marginTop: UI.gap,
        padding: UI.padLg,
        border: `1px solid ${UI.border}`,
        borderRadius: UI.radiusLg,
        background: UI.panel,
        position: "relative",
        overflow: "hidden",
        minHeight: 300,
        minWidth: 0, // ✅ clave
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
            background:
              "linear-gradient(90deg, transparent, rgba(255,159,67,0.95), transparent)",
            transform: "translateX(-60%)",
            animation: "clSweep 650ms ease-out infinite",
            opacity: 0.9,
            pointerEvents: "none",
          }}
        />
      )}
      
      <div
        style={{
          display: "flex",
          flexDirection: "column",     // ✅ mobile: stack
          alignItems: "stretch",
          gap: 10,
          minWidth: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 0.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Prices <span style={{ color: UI.orange }}>Batch</span>
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-start", // ✅ mobile: izquierda
            minWidth: 0,
          }}
        >
          <Chip>
            Auto:{" "}
            <button
              onClick={() => setAuto((v) => !v)}
              style={{
                all: "unset",
                cursor: "pointer",
                fontWeight: 950,
                color: auto ? UI.green : UI.red,
                marginLeft: 6,
              }}
              title="Pausar / reanudar auto refresh"
            >
              {auto ? "ON" : "OFF"}
            </button>
          </Chip>
          <Chip>
            Symbols: <span style={{ color: UI.orangeSoft }}>{symbolsCount}</span>
          </Chip>
          <Chip>
            Fiat: <span style={{ color: UI.orangeSoft }}>{fiatLabel}</span>
          </Chip>
          <Chip>
            Updated:{" "}
            <span style={{ color: UI.orangeSoft }}>
              {lastUpdated
                ? new Date(lastUpdated).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "--"}
            </span>
          </Chip>
          <Chip>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <RefreshDot on={auto && refreshing } />
              {refreshing || loading ? "updating" : "idle"}
            </span>
          </Chip>
        </div>
      </div>
      <p style={{ marginTop: 6, fontSize: 11, opacity: 0.65 }}>BFF batch: 1 request / 5s.</p>
      {refreshing && !loading && 
      <p style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
        Updating…
      </p>
      }

      {updatingFiat && <p style={{ opacity: 0.8 }}>Updating symbol…</p>}
      {error && <p style={{ color: UI.red }}>Error: {error}</p>}

      {showSkeleton &&(
        <div style={{ marginTop: 12 }}>
          ...skeleton...
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${UI.border}` }}>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800}}>Symbol</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Status</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Price</th>
                <th style={{ padding: "8px 6px" }}>Updated</th>
                <th style={{ padding: "8px 6px" }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${UI.borderSoft}` }}>
                  <td style={{ padding: "10px 6px" }}>
                    <Skeleton w={60} h={12} />
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <Skeleton w={90} h={12} r={999} />
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <Skeleton w={120} h={12} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ marginTop: 12, overflowX: "auto", maxHeight: 420 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${UI.border}`, position: "sticky", top: 0, background: UI.panel, zIndex: 1, }}>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Symbol</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Status</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Price</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Updated</th>
                <th style={{ padding: "10px 8px", fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const f = flashRow[r.symbol]; // ✅ aquí sí existe r
                const zebra = idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent";
                const isHover = hover === r.symbol;
                const bg =
                  isHover
                  ? "rgba(255,159,67,0.07)"
                  : zebra;

                const pct =
                  typeof r.price === "number" &&
                  typeof r.prevPrice === "number" &&
                  r.prevPrice !== 0
                    ? ((r.price - r.prevPrice) / r.prevPrice) * 100
                    : null;

                const pctTone =
                pct == null ? "rgba(255,255,255,0.55)" : pct > 0 ? UI.green : pct < 0 ? UI.red : "rgba(255,255,255,0.55)";

               return (
                <tr
                  key={r.symbol}
                  onMouseEnter={() => setHover(r.symbol)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    borderBottom: `1px solid ${UI.borderSoft}`,
                    background:
                      hover === r.symbol
                        ? "rgba(255,159,67,0.06)"
                        : f === "up"
                        ? "rgba(46,229,157,0.08)"
                        : f === "down"
                        ? "rgba(255,107,107,0.08)"
                        : "transparent",
                      transition: "background 160ms ease, transform 140ms ease",
                      transform: isHover ? "translateY(-1px)" : "translateY(0)",
                    }}
                  >
                  <td style={{ padding: "12px 8px", fontWeight: 950 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                      onClick={() => copySymbol(r.symbol)}
                    >
                      <span  style={{textShadow: hover === r.symbol ? "0 0 10px rgba(255,159,67,0.18)" : "none"}}>
                        <SymbolCell symbol={r.symbol} />
                      </span>
                      {hover === r.symbol && (
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 8,
                            display: "grid",
                            placeItems: "center",
                            border: `1px solid ${UI.border}`,
                            background: "rgba(255,255,255,0.03)",
                            opacity: 0.85,
                          }}
                          title="Copiar símbolo"
                        >
                          ⧉
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <CacheBadge v={r.cache} />
                      {r.ok === false && (
                        <span style={{ color: UI.red, fontSize: 12, fontWeight: 700 }}>
                          provider issue
                        </span>
                      )}
                    </div>
                  </td>

                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ fontWeight: 950, color: UI.orangeSoft }}>
                      {typeof r.price === "number"
                      ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: r.fiat || "USD",
                        maximumFractionDigits: r.fiat === "JPY" ? 0 : 2,
                      }).format(r.price)
                    : "—"}
                    </div>

                    <span style={{ color: pct == null ? "rgba(255,255,255,0.6)" : pct > 0 ? UI.green : pct < 0 ? UI.red : "rgba(255,255,255,0.6)" }}>
                      {pct == null ? "—" : `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`}
                    </span>
                  </td>

                  <td style={{ padding: "12px 8px", opacity: 0.85, fontSize: 12 }}>
                    {shortTime(r.updatedAt ?? r.ts)}
                  </td>

                  <td style={{ padding: "12px 8px", opacity: 0.85, fontSize: 12 }}>
                    {r.source ?? "—"}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    <Toast toast={toast} onClear={() => setToast(null)} />
      {copied && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "10px 14px",
            borderRadius: 999,
            border: `1px solid ${UI.border}`,
            background: "rgba(10,14,20,0.92)",
            boxShadow: "0 0 18px rgba(255,159,67,0.22)",
            fontSize: 12,
            fontWeight: 900,
            color: UI.orangeSoft,
            zIndex: 999,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            animation: "toastIn 160ms ease-out",
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,159,67,0.14)",
              border: "1px solid rgba(255,159,67,0.20)",
            }}
          >
            {/* icono copy ultra simple */}
            <span style={{ fontSize: 12, lineHeight: 1 }}>⧉</span>
          </span>

          <span>
            <span style={{ color: "#fff" }}>{copied}</span> copiado
          </span>

          <style>{`
            @keyframes toastIn {
              from { opacity: 0; transform: translateY(6px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0)   scale(1); }
            }
          `}</style>
        </div>
      )}
    </section>
  );
}
