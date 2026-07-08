"use client";

import { useEffect, useRef, useState } from "react";
import { getFiat } from "@/lib/fiatStore";
import { pushPriceHistory } from "@/lib/usePriceHistory";

/**
 * useOverviewPrices — SOLO para las cards gigantes de Overview (BTC, ETH fijos).
 *
 * Separado de usePricesFeed (que usa la selección del usuario y lo comparten
 * Watchlist y otros paneles). Este hook NO toca la selección: pide símbolos
 * FIJOS -> URLs estables -> el route /api/cryptolink/price se cachea (revalidate
 * 15s) -> N visitantes concurrentes comparten UNA llamada por símbolo. Rompe el
 * N=N que topaba Vercel y saturaba el Java.
 *
 * Llama al endpoint /v1/price (un símbolo) del back, vía /api/cryptolink/price
 * (cacheado). Una llamada por símbolo fijo.
 */

const OVERVIEW_SYMBOLS = ["BTC", "ETH"] as const;

export type OverviewPrice = {
  symbol: string;
  price?: number;
  change24h?: number;
  ts?: string;
  source?: string;
  ok: boolean;
};

async function fetchOnePrice(symbol: string, fiat: string): Promise<OverviewPrice> {
  // NO se manda x-api-key desde el navegador: el route la inyecta server-side.
  const res = await fetch(
    `/api/cryptolink/price?symbol=${encodeURIComponent(symbol)}&fiat=${encodeURIComponent(fiat)}`,
    { /* el caché lo maneja el route (revalidate); aquí no forzamos no-store */ }
  );
  const j = await res.json().catch(() => null);
  const price =
    typeof j?.price === "number"
      ? j.price
      : typeof j?.data?.price === "number"
      ? j.data.price
      : undefined;
  return {
    symbol,
    price,
    change24h: typeof j?.change24h === "number" ? j.change24h : undefined,
    ts: j?.ts,
    source: j?.source,
    ok: !!j?.ok && typeof price === "number",
  };
}

export function useOverviewPrices() {
  const [prices, setPrices] = useState<OverviewPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seqRef = useRef(0);

  useEffect(() => {
    let stopped = false;
    let id: ReturnType<typeof setInterval> | null = null;

    async function load() {
      const seq = ++seqRef.current;
      try {
        setError(null);
        const fiat = getFiat();
        const results = await Promise.all(
          OVERVIEW_SYMBOLS.map((s) => fetchOnePrice(s, fiat))
        );
        if (stopped || seq !== seqRef.current) return;
        setPrices(results);
        for (const r of results) {
          if (typeof r.price === "number") {
            pushPriceHistory(r.symbol, fiat, r.price, 600);
          }
        }
      } catch (e: any) {
        if (!stopped) setError(e?.message ?? "error");
      } finally {
        if (!stopped) setLoading(false);
      }
    }

    load();

    // polling 15s, pausado si la pestaña está oculta (ahorra invocations)
    const startPolling = () => {
      if (id) clearInterval(id);
      id = setInterval(() => {
        if (document.visibilityState === "visible") load();
      }, 15000);
    };
    startPolling();

    const onFiat = () => load();
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("cryptolink:fiat" as any, onFiat);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopped = true;
      if (id) clearInterval(id);
      window.removeEventListener("cryptolink:fiat" as any, onFiat);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return { prices, error, loading };
}
