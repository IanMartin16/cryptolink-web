"use client";

import type { PriceRow } from "@/lib/types";

let lastRows: PriceRow[] = [];

export function pushMarketPulseRows(rows: PriceRow[], max = 20) {
  if (!Array.isArray(rows) || !rows.length) return;

  lastRows = rows
    .filter((r) => r && r.symbol)
    .slice(0, max)
    .map((r) => ({ ...r }));
}

export function getMarketPulseRows(): PriceRow[] {
  return lastRows;
}