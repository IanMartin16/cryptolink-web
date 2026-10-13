"use client";

import { useEffect, useMemo, useState } from "react";
import SymbolCell from "@/components/SymbolCell";

/**
 * TopMoversStrip — universo completo (~400 curados), NO el rotate.
 * Se alimenta de /v1/top-movers (derivado de historical_prices) vía BFF.
 * Independiente de rows/markets: ve a todos, incluidos los que no rotan pero
 * que sí son muy buscados (ese era el punto ciego del rotate).
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

function MoverPill({ r }: { r: ApiMover }) {
  const up = r.changePct > 0;
  const c = up ? "text-emerald-300" : "text-rose-300";
  const vol = fmtVol(r.volume24h);
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5">
      <SymbolCell symbol={r.symbol} showName />
      <div className="flex flex-col items-end leading-tight">
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
}: {
  title: string;
  arrow: string;
  tone: "up" | "down";
  rows: ApiMover[];
  windowLabel: string;
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
          <div className="px-2 py-3 text-xs text-white/45">No {title.toLowerCase()} right now.</div>
        )}
      </div>
    </div>
  );
}

export default function TopMoversStrip({
  window: win = "24h",
  limit = 10,
  endpoint = "/api/cryptolink/top-movers",
}: {
  window?: string;
  limit?: number;
  endpoint?: string;
}) {
  const [data, setData] = useState<ApiResponse | null>(null);
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
        const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
        if (!r.ok) throw new Error(`top-movers ${r.status}`);
        const json: ApiResponse = await r.json();
        if (alive && json?.ok) setData(json);
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
  }, [url]);

  const windowLabel = win.toLowerCase();

  // primer render sin datos: no ocupamos espacio con una tira vacía
  if (loading && !data) return null;
  if (!data) return null;

  const gainers = data.gainers?.slice(0, limit) ?? [];
  const losers = data.losers?.slice(0, limit) ?? [];
  if (gainers.length === 0 && losers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Group title="Top Gainers" arrow="▲" tone="up" rows={gainers} windowLabel={windowLabel} />
      <Group title="Top Losers" arrow="▼" tone="down" rows={losers} windowLabel={windowLabel} />
    </div>
  );
}
