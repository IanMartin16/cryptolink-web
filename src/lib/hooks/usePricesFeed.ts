"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFiat } from "@/lib/fiatStore";
import { getApiKey } from "@/lib/apiKey";
import { getSymbols } from "@/lib/symbolsStore";
import { fetchPricesBatch } from "@/lib/cryptoLink";
import type { Health } from "@/lib/health";
import type { PriceRow } from "@/lib/types";

export function usePricesFeed({
  onRows,
  onHealth,
}: {
  onRows?: (rows: PriceRow[]) => void;
  onHealth?: (h: Health) => void;
}) {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingFiat, setUpdatingFiat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [auto, setAuto] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [symbolsCount, setSymbolsCount] = useState(0);
  const [fiatLabel, setFiatLabel] = useState("USD");
  const [flashRow, setFlashRow] = useState<Record<string, "up" | "down">>({});

  const reqSeq = useRef(0);
  const lastPriceRef = useRef<Record<string, number>>({});
  const flashTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const updateMeta = useCallback(() => {
    const s = getSymbols();
    setSymbolsCount(s.length);
    setFiatLabel(getFiat());
  }, []);

  const load = useCallback(
    async (kind: "initial" | "refresh" = "refresh") => {
      const seq = ++reqSeq.current;

      try {
        setError(null);
        if (kind === "initial") setLoading(true);
        else setRefreshing(true);

        const apiKey = getApiKey();
        const fiat = getFiat();
        const symbols = getSymbols();

        if (kind !== "initial" && (!symbols || symbols.length === 0)) return;

        const res = await fetchPricesBatch(symbols, fiat, apiKey ?? "");
        if (seq !== reqSeq.current) return;

        const mapped: PriceRow[] = (res.data ?? []).map((item: any) => {
          const d = item.data;
          const price = d?.price ?? d?.data?.price ?? d?.value ?? d?.rate;
          const err = d?.error || d?.message || (!item.ok ? "upstream_error" : undefined);
          const ts = d?.ts ?? d?.data?.ts;
          const source = d?.source ?? d?.data?.source;

          return {
            symbol: item.symbol,
            fiat: res.fiat,
            price: typeof price === "number" ? price : undefined,
            cache: item.cache,
            ok: item.ok,
            err,
            ts,
            source,
            updatedAt: new Date().toISOString(),
          };
        });

        if (kind !== "initial" && mapped.length === 0) return;

        setRows((prev) => {
          const prevMap = new Map(prev.map((r) => [r.symbol, r]));

          const nextRows: PriceRow[] = mapped.map((cur) => {
            const old = prevMap.get(cur.symbol);

            const newPrice =
              typeof cur.price === "number" ? cur.price : old?.price;

            const oldPrice =
              typeof old?.price === "number" ? old.price : undefined;

            const prevPrice =
              typeof oldPrice === "number" &&
              typeof newPrice === "number" &&
              newPrice !== oldPrice
                ? oldPrice
                : old?.prevPrice;

            const pct =
              typeof newPrice === "number" &&
              typeof prevPrice === "number" &&
              prevPrice !== 0
                ? ((newPrice - prevPrice) / prevPrice) * 100
                : old?.pct;

            return {
              ...old,
              ...cur,
              price: newPrice,
              prevPrice,
              pct,
            };
          });

          const newFlashes: Record<string, "up" | "down"> = {};
          for (const r of nextRows) {
            if (typeof r.price !== "number") continue;
            const last = lastPriceRef.current[r.symbol];
            if (typeof last === "number") {
              if (r.price > last) newFlashes[r.symbol] = "up";
              else if (r.price < last) newFlashes[r.symbol] = "down";
            }
            lastPriceRef.current[r.symbol] = r.price;
          }

          if (Object.keys(newFlashes).length) {
            setFlashRow((prevFlash) => ({ ...prevFlash, ...newFlashes }));
            for (const sym of Object.keys(newFlashes)) {
              if (flashTimersRef.current[sym]) clearTimeout(flashTimersRef.current[sym]);
              flashTimersRef.current[sym] = setTimeout(() => {
                setFlashRow((m) => {
                  const copy = { ...m };
                  delete copy[sym];
                  return copy;
                });
              }, 450);
            }
          }

          queueMicrotask(() => {
            if (seq !== reqSeq.current) return;
            onRows?.(nextRows);
            onHealth?.({ ok: true, lastOkAt: new Date().toISOString() });
          });

          setLastUpdated(new Date().toISOString());
          return nextRows;
        });
      } catch (e: any) {
        if (seq !== reqSeq.current) return;
        const msg = e?.message ?? "Error cargando precios";
        setError(msg);

        queueMicrotask(() => {
          if (seq !== reqSeq.current) return;
          onHealth?.({ ok: false, lastErr: msg });
        });
      } finally {
        if (seq !== reqSeq.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [onRows, onHealth]
  );

  useEffect(() => {
    updateMeta();
    load("initial");

    let id: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (id) clearInterval(id);
      if (!auto) return;
      id = setInterval(() => load("refresh"), 15000);
    };

    startPolling();

    const onFiat = () => {
      updateMeta();
      setUpdatingFiat(true);
      load("refresh").finally(() => setUpdatingFiat(false));
    };

    const onSymbols = () => {
      updateMeta();
      setTimeout(() => load("refresh"), 0);
    };

    window.addEventListener("cryptolink:fiat" as any, onFiat);
    window.addEventListener("cryptolink:symbols" as any, onSymbols);

    return () => {
      if (id) clearInterval(id);
      Object.values(flashTimersRef.current).forEach(clearTimeout);
      window.removeEventListener("cryptolink:fiat" as any, onFiat);
      window.removeEventListener("cryptolink:symbols" as any, onSymbols);
    };
  }, [auto, load, updateMeta]);

  const reload = useCallback(() => load("refresh"), [load]);

  return {
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
    reload,
  };
}