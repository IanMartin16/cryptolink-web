"use client";

import { useEffect, useState } from "react";

type Dist = { bucket: string; events: number; pct: number };
type CollapseRisk = {
  ok: boolean;
  ts?: string;
  window?: string;
  cohort?: { matured: number; events: number; censored: number; stuck: number };
  baseRate?: { collapsePct: number | null; survivePct: number | null; oneInN: number | null };
  dynamics?: {
    medianTimeToEventH: number | null;
    avgTimeToEventH: number | null;
    medianDumpSpeedH: number | null;
    avgMaxDrawdownPct: number | null;
  };
  distribution?: Dist[];
  method?: string;
  disclaimer?: string;
};

function ago(iso?: string) {
  if (!iso) return null;
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (Number.isNaN(m)) return null;
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
      <div className="text-lg font-semibold tabular-nums text-white/85">{value}</div>
      <div className="mt-0.5 text-[11px] text-white/45">{label}</div>
    </div>
  );
}

export default function CollapseRiskPanel() {
  const [d, setD] = useState<CollapseRisk | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/social/insights/collapse-risk", {
          headers: { accept: "application/json" },
        });
        const json = await res.json();
        if (!cancelled) {
          if (json?.ok) setD(json);
          else setErr(json?.error ?? "unknown");
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err)
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
        No se pudo cargar collapse-risk: <b>{err}</b>
      </div>
    );
  if (!d)
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
        Cargando…
      </div>
    );

  const collapse = d.baseRate?.collapsePct ?? null;
  const survive = d.baseRate?.survivePct ?? null;
  const oneIn = d.baseRate?.oneInN ?? null;
  const dist = d.distribution ?? [];
  const maxPct = Math.max(1, ...dist.map((x) => x.pct));

  return (
    <section className="w-full rounded-xl border border-white/10 bg-white/[0.03]">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-rose-400/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-300">
            INSIGHTS
          </span>
          <h3 className="text-sm font-semibold text-white/85">Trending → Collapse Risk</h3>
        </div>
        <span className="text-[11px] text-white/40">
          n={d.cohort?.matured ?? "—"} · {d.window}
          {ago(d.ts) ? ` · ${ago(d.ts)}` : ""}
        </span>
      </div>

      <div className="p-4">
        {/* headline */}
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <div className="text-4xl font-bold tabular-nums text-rose-300">
              {collapse != null ? `${collapse}%` : "—"}
            </div>
            <div className="mt-1 text-xs text-white/55">colapsa ≥80% en {d.window}</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-emerald-300">
              {survive != null ? `${survive}%` : "—"}
            </div>
            <div className="mt-1 text-xs text-white/55">sobrevive</div>
          </div>
          {oneIn != null && (
            <div className="text-xs text-white/50">
              ≈ 1 de cada <span className="font-semibold text-white/80">{oneIn}</span> que trendean
            </div>
          )}
        </div>

        {/* distribución: cuándo colapsan */}
        <div className="mt-5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/45">
            Cuándo colapsan
          </div>
          <div className="space-y-1.5">
            {dist.map((b) => (
              <div key={b.bucket} className="flex items-center gap-3">
                <div className="w-12 text-xs tabular-nums text-white/60">{b.bucket}</div>
                <div className="relative h-4 flex-1 overflow-hidden rounded bg-white/[0.04]">
                  <div
                    className="absolute inset-y-0 left-0 rounded bg-rose-400/50"
                    style={{ width: `${(b.pct / maxPct) * 100}%` }}
                  />
                </div>
                <div className="w-20 text-right text-xs tabular-nums text-white/70">
                  {b.pct}% ({b.events})
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* dinámica */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat
            label="Mediana a colapso"
            value={d.dynamics?.medianTimeToEventH != null ? `${d.dynamics.medianTimeToEventH}h` : "—"}
          />
          <Stat
            label="Mediana de dump"
            value={d.dynamics?.medianDumpSpeedH != null ? `${d.dynamics.medianDumpSpeedH}h` : "—"}
          />
          <Stat
            label="Drawdown prom."
            value={d.dynamics?.avgMaxDrawdownPct != null ? `${d.dynamics.avgMaxDrawdownPct}%` : "—"}
          />
        </div>

        {/* método + disclaimer */}
        {d.method && <p className="mt-4 text-[11px] leading-relaxed text-white/35">{d.method}</p>}
        {d.disclaimer && <p className="mt-1 text-[11px] text-white/30">{d.disclaimer}</p>}
      </div>
    </section>
  );
}
