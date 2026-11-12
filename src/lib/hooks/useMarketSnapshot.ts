// lib/hooks/useMarketSnapshot.ts
"use client";
import { useEffect, useState } from "react";
import type { SnapshotKPIs, PriceRow } from "@/lib/types";
import { computeSnapshotKPIs } from "@/lib/snapshotEngine";

type Status = "live" | "restored" | "refreshing";

type OverviewItem = {
  rank: number; symbol: string; price: number;
  change24h: number | null; change7d: number | null;
  volume24h: number | null; marketCap: number | null; spark: number[];
};

export function useMarketSnapshot(refreshMs = 120_000) { // datos lentos (hora/día) → 2 min basta
  const [snapshot, setSnapshot] = useState<SnapshotKPIs>({ updatedAt: Date.now(), items: [] });
  const [status, setStatus] = useState<Status>("refreshing");

  useEffect(() => {
    let cancelled = false;
    const social = process.env.NEXT_PUBLIC_SOCIAL_LINK_BASE_URL;

    async function load() {
      const [ov, ms, fg] = await Promise.allSettled([
        fetch("/api/cryptolink/overview", { headers: { accept: "application/json" } }).then(r => r.json()),
        fetch("/api/social/market-structure?window=30d", { headers: { accept: "application/json" } }).then(r => r.json()),
        social
          ? fetch(`${social}/internal/v1/attention?limit=1`, { headers: { accept: "application/json" }, cache: "no-store" }).then(r => r.json())
          : Promise.reject(new Error("no social base")),
      ]);

      // overview (top 100 por mcap) → rows + mcap agregado
      let rows: PriceRow[] = [];
      let mcap: { totalUsd: number; change24h: number } | null = null;
      if (ov.status === "fulfilled") {
        const list: OverviewItem[] = ov.value?.assets ?? ov.value?.items ?? ov.value ?? [];
        if (Array.isArray(list) && list.length) {
          rows = list.map((a) => ({ symbol: a.symbol, price: a.price, pct: a.change24h ?? undefined })) as PriceRow[];
          // mcap total + cambio 24h PONDERADO por mcap (honesto: BTC/ETH pesan lo que deben)
          let tot = 0, w = 0;
          for (const a of list) {
            if (a.marketCap == null) continue;
            tot += a.marketCap;
            if (a.change24h != null) w += a.marketCap * a.change24h;
          }
          if (tot > 0) mcap = { totalUsd: tot, change24h: w / tot };
        }
      }

      // market-structure → dominancia
      const dominance = (ms.status === "fulfilled" && ms.value?.btcDominance != null)
        ? { btc: ms.value.btcDominance, eth: ms.value.ethDominance ?? 0 }
        : null;

      // F&G → backdrop del endpoint de atención (igual que useMarketAttention)
      let fng: { value: number; label: string } | null = null;
      if (fg.status === "fulfilled") {
        const bd = fg.value?.backdrop ?? null;
        if (bd?.fearGreedValue != null) fng = { value: Number(bd.fearGreedValue), label: String(bd.fearGreedLabel ?? "") };
      }

      const snap = computeSnapshotKPIs({ rows, dominance, fng, mcap });
      if (!cancelled) { setSnapshot(snap); setStatus(rows.length ? "live" : "refreshing"); }
    }

    load();
    const id = setInterval(load, refreshMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [refreshMs]);

  return { snapshot, status };
}