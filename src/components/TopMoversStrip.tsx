"use client";

import { useEffect, useMemo, useState } from "react";
import SymbolCell from "@/components/SymbolCell";

/**
 * TopMoversStrip — universo completo (~400 curados), NO el rotate.
 * Se alimenta de /v1/top-movers (derivado de historical_prices) vía BFF.
 * Independiente de rows/markets: ve a todos, incluidos los que no rotan pero
 * que sí son muy buscados (ese era el punto ciego del rotate).
 *
 * CRUCE integrado (no panel aparte): además trae la atención (trending_snapshot
 * vía el endpoint de Market Attention) y MARCA con 👁 los movers que además
 * están entre los más buscados = "se mueve Y lo buscan". Toggle opcional para
 * filtrar solo esos. Sin el toggle, se ve como un top movers normal.
 */

// ---- shape que devuelve /v1/top-movers ----
type ApiMover = {
  symbol: string;
  price: number;
  changePct: number;
  marketCap?: number;
  volume24h?: number;
};
type ApiResponse = {
  ok: boolean;
  fiat: string;
  window: string;
  windowHours: number;
  universeSize: number;
  gainers: ApiMover[];
  losers: ApiMover[];
};

// ---- shape del endpoint de atención (Market Attention v2) ----
type AttentionLeader = {
  asset: string;
  attentionScore: number;
  attentionDeltaPct: number;
  direction: "up" | "down" | string;
  avgPosition: number;
  appearances: number;
};
type AttentionResponse = {
  ok: boolean;
  market?: { attentionLeaders?: AttentionLeader[] };
};

type CrossedMover = ApiMover & { att?: AttentionLeader };

const REFRESH_MS = 120_000; // el backend cachea 60s y el job histórico corre por hora

function fmtPrice(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return n >= 1000 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n.toFixed(6);
}

function fmtVol(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function AttBadge({ att }: { att: AttentionLeader }) {
  const rising = att.direction === "up";
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-md border border-sky-400/25 bg-sky-400/10 px-1 py-0.5 text-[9px] font-medium tabular-nums text-sky-200"
      title={`Buscado · atención ${Math.round(att.attentionScore)} · pos. prom. ${att.avgPosition.toFixed(1)} · ${att.attentionDeltaPct > 0 ? "+" : ""}${Math.round(att.attentionDeltaPct)}%`}
    >
      👁 {Math.round(att.attentionScore)}
      <span className={rising ? "text-sky-300" : "text-white/40"}>{rising ? "▲" : "▼"}</span>
    </span>
  );
}

function MoverPill({ r }: { r: CrossedMover }) {
  const up = r.changePct > 0;
  const c = up ? "text-emerald-300" : "text-rose-300";
  const vol = fmtVol(r.volume24h);
  const wanted = !!r.att;
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 ${
        wanted ? "border-sky-400/25 bg-sky-400/[0.05]" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <SymbolCell symbol={r.symbol} showName />
        {r.att && <AttBadge att={r.att} />}
      </div>
      <div className="flex shrink-0 flex-col items-end leading-tight">
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-white/70">{fmtPrice(r.price)}</span>
          <span className={`text-xs font-semibold tabular-nums ${c}`}>
            {up ? "+" : ""}
            {r.changePct.toFixed(2)}%
          </span>
        </div>
        {vol && (
          <span className="text-[10px] tabular-nums text-white/35" title="Volumen 24h">
            vol {vol}
          </span>
        )}
      </div>
    </div>
  );
}

function Group({
  title,
  arrow,
  tone,
  rows,
  windowLabel,
  emptyMsg,
}: {
  title: string;
  arrow: string;
  tone: "up" | "down";
  rows: CrossedMover[];
  windowLabel: string;
  emptyMsg: string;
}) {
  const headColor = tone === "up" ? "text-emerald-300" : "text-rose-300";
  return (
    <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className={`text-xs font-semibold tracking-wide ${headColor}`}>
          {arrow} {title}
        </div>
        <div className="text-[11px] text-white/45">{windowLabel}</div>
      </div>
      <div className="space-y-1.5 p-2">
        {rows.length ? (
          rows.map((r) => <MoverPill key={r.symbol} r={r} />)
        ) : (
          <div className="px-2 py-3 text-xs text-white/45">{emptyMsg}</div>
        )}
      </div>
    </div>
  );
}

export default function TopMoversStrip({
  window: win = "24h",
  limit = 15,
  endpoint = "/api/cryptolink/top-movers",
  attentionEndpoint = "/api/social/attention", 
}: {
  window?: string;
  limit?: number;
  endpoint?: string;
  attentionEndpoint?: string;
}) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [att, setAtt] = useState<Map<string, AttentionLeader>>(new Map());
  const [onlyWanted, setOnlyWanted] = useState(false); // por defecto: todos los movers
  const [loading, setLoading] = useState(true);

  const url = useMemo(
    () => `${endpoint}?window=${encodeURIComponent(win)}&limit=${limit}`,
    [endpoint, win, limit]
  );

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function load() {
      try {
        const [mRes, aRes] = await Promise.allSettled([
          fetch(url, { signal: ctrl.signal, cache: "no-store" }),
          fetch(attentionEndpoint, { signal: ctrl.signal, cache: "no-store" }),
        ]);

        if (mRes.status === "fulfilled" && mRes.value.ok) {
          const json: ApiResponse = await mRes.value.json();
          if (alive && json?.ok) setData(json);
        }
        if (aRes.status === "fulfilled" && aRes.value.ok) {
          const j: AttentionResponse = await aRes.value.json();
          const leaders = j?.market?.attentionLeaders ?? [];
          const map = new Map<string, AttentionLeader>();
          for (const l of leaders) map.set(l.asset.toUpperCase(), l);
          if (alive) setAtt(map);
        }
      } catch {
        /* silencioso: la tira no debe romper la página */
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      ctrl.abort();
      clearInterval(id);
    };
  }, [url, attentionEndpoint]);

  const windowLabel = win.toLowerCase();

  const { gainers, losers, wantedCount, totalCount } = useMemo(() => {
    const annotate = (arr: ApiMover[] = []): CrossedMover[] =>
      arr.slice(0, limit).map((m) => ({ ...m, att: att.get(m.symbol.toUpperCase()) }));
    let g = annotate(data?.gainers);
    let l = annotate(data?.losers);
    const total = g.length + l.length;
    const wanted = g.filter((x) => x.att).length + l.filter((x) => x.att).length;
    if (onlyWanted) {
      g = g.filter((x) => x.att);
      l = l.filter((x) => x.att);
    }
    return { gainers: g, losers: l, wantedCount: wanted, totalCount: total };
  }, [data, att, onlyWanted, limit]);

  // primer render sin datos: no ocupamos espacio con una tira vacía
  if (loading && !data) return null;
  if (!data) return null;
  if (totalCount === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-3">
        {wantedCount > 0 && (
          <span className="text-[11px] text-sky-200/80">
            👁 {wantedCount} are also between the most wanted
          </span>
        )}
        {wantedCount > 0 && (
          <button
            onClick={() => setOnlyWanted((v) => !v)}
            className="rounded-md border border-white/15 bg-white/[0.03] px-2 py-1 text-[11px] text-white/70 hover:bg-white/[0.07]"
          >
            {onlyWanted ? "Show All" : "Only Wanted"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Group
          title="Top Gainers"
          arrow="▲"
          tone="up"
          rows={gainers}
          windowLabel={windowLabel}
          emptyMsg={onlyWanted ? "Ningún gainer está entre los más buscados." : "No gainers right now."}
        />
        <Group
          title="Top Losers"
          arrow="▼"
          tone="down"
          rows={losers}
          windowLabel={windowLabel}
          emptyMsg={onlyWanted ? "Ningún loser está entre los más buscados." : "No losers right now."}
        />
      </div>
    </div>
  );
}
