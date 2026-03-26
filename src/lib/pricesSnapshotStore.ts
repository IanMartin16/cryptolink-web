import type { PriceRow } from "@/lib/types";

const KEY = "cryptolink:prices:snapshot";

export function getPricesSnapshot(): PriceRow[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setPricesSnapshot(rows: PriceRow[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    // no-op
  }
}