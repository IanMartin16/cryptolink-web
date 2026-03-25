"use client";

import { useEffect, useState } from "react";
import { getFiat, setFiat } from "@/lib/fiatStore";

type FiatsResponse =
  | string[]
  | { data?: string[]; fiats?: string[]; ok?: boolean };

function normalizeFiats(r: FiatsResponse): string[] {
  if (Array.isArray(r)) return r.map((x) => String(x).toUpperCase());

  const list = (r as any)?.fiats ?? (r as any)?.data;
  if (Array.isArray(list)) return list.map((x: any) => String(x).toUpperCase()).filter(Boolean);

  return ["USD"];
}

export default function FiatToggle() {
  const [fiats, setFiats] = useState<string[]>([]);
  const [current, setCurrent] = useState<string>("USD");
  const [err, setErr] = useState<string | null>(null);

  async function loadFiats() {
    try {
      setErr(null);
      const res = await fetch("/api/cryptolink/fiats", { cache: "no-store" });
      if (!res.ok) throw new Error(`fiats HTTP ${res.status}`);
      const json = (await res.json()) as FiatsResponse;

      const list = normalizeFiats(json);
      setFiats(list);

      const saved = getFiat();
      const savedStr = String(saved).toUpperCase();

      const next = list.includes(savedStr) ? savedStr : list[0] || "USD";
      setCurrent(next);
      setFiat(next as any);
      window.dispatchEvent(new CustomEvent("cryptolink:fiat"));
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando fiats");
      const saved = String(getFiat()).toUpperCase();
      setFiats(["USD", "MXN"]);
      setCurrent(saved === "MXN" ? "MXN" : "USD");
    }
  }

  useEffect(() => {
    loadFiats();
  }, []);

  const pick = (v: string) => {
    setFiat(v as any);
    setCurrent(v);
    window.dispatchEvent(new CustomEvent("cryptolink:fiat"));
  };

  return (
    <section
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))",
        boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 12, opacity: 0.66, color: "#f59e0b" }}>
            Fiat Layer
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: 1,
              letterSpacing: -0.3,
            }}
          >
            Quote Currency
          </h2>
        </div>

        <button
          onClick={loadFiats}
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 12,
            color: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(6px)",
          }}
        >
          Refresh
        </button>
      </div>

      <p
        style={{
          marginTop: 8,
          marginBottom: 0,
          fontSize: 13,
          lineHeight: 1.5,
          opacity: 0.72,
          maxWidth: 620,
        }}
      >
        Select the quote currency used across price views and market panels.
      </p>

      {err ? (
        <div
          style={{
            marginTop: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.035)",
            fontSize: 12,
            color: "rgba(255,255,255,0.76)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#f87171",
              boxShadow: "0 0 10px rgba(248,113,113,0.45)",
            }}
          />
          limited fiat list • {err}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 14,
        }}
      >
        {fiats.map((f) => {
          const active = current === f;

          return (
            <button
              key={f}
              onClick={() => pick(f)}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: active
                  ? "1px solid rgba(52,211,153,0.22)"
                  : "1px solid rgba(255,255,255,0.10)",
                background: active
                  ? "linear-gradient(180deg, rgba(52,211,153,0.16), rgba(52,211,153,0.05))"
                  : "rgba(255,255,255,0.03)",
                cursor: "pointer",
                fontWeight: active ? 800 : 600,
                color: active ? "rgba(220,252,231,0.96)" : "rgba(255,255,255,0.74)",
                boxShadow: active
                  ? "0 0 0 1px rgba(52,211,153,0.05), 0 10px 24px rgba(0,0,0,0.16)"
                  : "none",
                transition: "all 160ms ease",
                letterSpacing: 0.2,
              }}
              aria-pressed={active}
              title={active ? "Selected fiat" : `Switch to ${f}`}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {active ? (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#34d399",
                      boxShadow: "0 0 10px rgba(52,211,153,0.5)",
                    }}
                  />
                ) : null}
                {f}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}