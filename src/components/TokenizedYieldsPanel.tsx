"use client";
import { useEffect, useState } from "react";
import { UI } from "@/lib/ui";
import DataStatusBadge from "@/components/DataStatusBadge";
import SymbolCell from "@/components/SymbolCell";

type YieldItem = {
  symbol: string;
  nav: number;
  apy30d: number | null;          // null cuando status !== "number"
  status: "number" | "accruing";
};
type Resp = { ok: boolean; items: YieldItem[] };   // YItem → YieldItem

const fmtNav = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: n >= 100 ? 2 : 4 })}`;

export default function TokenizedYieldsPanel() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">("refreshing");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setErr("");
        const r = await fetch("/api/cryptolink/tokenized-yields", { headers: { accept: "application/json" } });
        const j = await r.json();
        if (!cancelled) j?.ok ? (setData(j), setStatus("live")) : setErr(j?.error ?? "unknown");
      } catch (e: any) { if (!cancelled) setErr(e?.message ?? "unknown"); }
    }
    load();
    const id = setInterval(load, 300000); // accrual lento → refresco tranquilo
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const section: React.CSSProperties = {
    marginTop: UI.gap, padding: 18, border: `1px solid ${UI.border}`, borderRadius: 18,
    background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    boxShadow: "0 16px 50px rgba(0,0,0,0.22)", minWidth: 0, overflow: "hidden",
  };
  if (err) return <section style={section}><h2 style={{ margin: 0, fontSize: 22 }}>Tokenized <span style={{ color: UI.orange }}>Yields</span></h2><p style={{ marginTop: 8 }}>Cannot load: <b>{err}</b></p></section>;

  const items = data?.items ?? [];
  return (
    <section style={section}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Tokenized <span style={{ color: UI.orange }}>Yields</span></h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 14 }}>
            Implied APY on yield-bearing RWA — derived from NAV accrual, which price trackers don’t show.
          </p>
        </div>
        <DataStatusBadge status={status} />
      </div>

      <div style={{ marginTop: 14, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${UI.border}` }}>
              <th style={th}>Asset</th>
              <th style={{ ...th, textAlign: "right" }}>NAV</th>
              <th style={{ ...th, textAlign: "right" }}>Implied APY <span style={{ opacity: 0.5, fontWeight: 400 }}>(30d)</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.symbol} style={{ borderBottom: `1px solid ${UI.borderSoft}` }}>
                <td style={td}><SymbolCell symbol={it.symbol} showName /></td>
                <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtNav(it.nav)}</td>
                <td style={{
                    ...td, textAlign: "right", fontVariantNumeric: "tabular-nums",
                    fontWeight: 800,
                    color:   it.status === "number" ? UI.green : undefined,
                    opacity: it.status === "number" ? 1 : 0.45,
                  }}>
                {it.status === "number" && it.apy30d != null
                  ? `${it.apy30d.toFixed(2)}%`
                  : "accruing"}
                </td>
              </tr>
            ))}
            {items.length === 0 && !err && (
              <tr><td colSpan={3} style={{ ...td, opacity: 0.6 }}>No derivable yields yet — accruing history.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12, fontSize: 11, opacity: 0.5 }}>
        Implied APY = annualized NAV accrual over the window. Derived estimate, not issuer-reported. Shown only for funds whose NAV accrues in price; $1-pegged / rebasing funds are excluded.
      </p>
    </section>
  );
}
const th: React.CSSProperties = { padding: "10px 10px", fontSize: 12, opacity: 0.7, fontWeight: 800, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px 10px", fontSize: 13, whiteSpace: "nowrap" };