// lib/hooks/useMarketSnapshot.ts
"use client";
import { useEffect, useState } from "react";
import type { SnapshotKPIs, PriceRow } from "@/lib/types";
import { computeSnapshotKPIs } from "@/lib/snapshotEngine";

type Status = "live" | "restored" | "refreshing";

export function useMarketSnapshot(refreshMs = 60000) {
  const [snapshot, setSnapshot] = useState<SnapshotKPIs>({ updatedAt: Date.now(), items: [] });
  const [status, setStatus] = useState<Status>("refreshing");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [ov, ms, fg] = await Promise.allSettled([
        fetch("/api/cryptolink/overview", { headers: { accept: "application/json" } }).then(r => r.json()),
        fetch("/api/social/market-structure?window=30d", { headers: { accept: "application/json" } }).then(r => r.json()),
        fetch("/api/social/fng", { headers: { accept: "application/json" } }).then(r => r.json()), // ← el que ya usa AttentionPulse
      ]);

      // overview → rows (top 100 por mcap, buen proxy de mercado)
      let rows: PriceRow[] = [];
      if (ov.status === "fulfilled" && Array.isArray(ov.value?.assets)) {
        rows = ov.value.assets.map((a: any) => ({
          symbol: a.symbol,
          price: a.price,
          pct: a.change24h ?? a.change_24h,   // ajusta al shape real de tu overview
        })) as PriceRow[];
      }

      // market-structure → dominancia
      let dominance = (ms.status === "fulfilled" && ms.value?.btcDominance != null)
        ? { btc: ms.value.btcDominance, eth: ms.value.ethDominance ?? 0 } : null;

      // fng
      let fng = (fg.status === "fulfilled" && fg.value?.value != null)
        ? { value: fg.value.value, label: fg.value.label ?? fg.value.classification ?? "" } : null;

      const snap = computeSnapshotKPIs({ rows, dominance, fng /*, mcap opcional */ });
      if (!cancelled) { setSnapshot(snap); setStatus(rows.length ? "live" : "refreshing"); }
    }
    load();
    const id = setInterval(load, refreshMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [refreshMs]);

  return { snapshot, status };
}