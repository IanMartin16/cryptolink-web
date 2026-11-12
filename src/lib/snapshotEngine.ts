// lib/snapshotEngine.ts
import type { PriceRow, SnapshotKPIs, SnapshotKPI } from "./types";

type SnapshotInput = {
  rows: PriceRow[];                                      // universo COMPLETO (no 18)
  dominance?: { btc: number; eth: number } | null;       // market-structure
  fng?: { value: number; label: string } | null;         // alternative.me (vía AttentionPulse)
  mcap?: { totalUsd: number; change24h: number } | null; // overview (opcional)
};

function safe(n: number | undefined, fallback = NaN) {
  return Number.isFinite(n as number) ? (n as number) : fallback;
}

function fngTone(v: number): SnapshotKPI["tone"] {
  if (v < 25) return "bad";       // extreme fear → rojo
  if (v < 45) return "warn";      // fear → ámbar
  if (v <= 55) return "neutral";  // neutral → gris
  return "good";                  // greed / extreme greed → verde (convención del gauge)
}

function fmtUsd(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
  return `$${Math.round(n)}`;
}

export function computeSnapshotKPIs(input: SnapshotInput): SnapshotKPIs {
  const items: SnapshotKPI[] = [];

  // -------------------------
  // 1) UP/DOWN % (hecho real — se conserva del engine original)
  // -------------------------
  let up = 0, down = 0, flat = 0, valid = 0;
  const FLAT_EPS = 0.0002; // 0.02% — ahora SÍ se usa (antes se declaraba y no)

  for (const r of input.rows || []) {
    const price = safe(r.price);
    const prev = safe(r.prevPrice);

    let delta: number | null = null;
    if (typeof r.pct === "number" && Number.isFinite(r.pct)) {
      delta = r.pct / 100;
    } else if (Number.isFinite(price) && Number.isFinite(prev) && prev !== 0) {
      delta = (price - prev) / prev;
    }
    if (delta == null) continue;
    valid++;

    if (Math.abs(delta) < FLAT_EPS) flat++;
    else if (delta > 0) up++;
    else down++;
  }

  const upPct = valid ? (up / valid) * 100 : 0;
  const downPct = valid ? (down / valid) * 100 : 0;
  const flatPct = valid ? (flat / valid) * 100 : 0;
  const upDownDiff = upPct - downPct;

  const diffThresh = valid >= 12 ? 10 : 20;
  const upDownTone: SnapshotKPI["tone"] =
    upDownDiff >= diffThresh ? "good" : upDownDiff <= -diffThresh ? "bad" : "neutral";

  items.push({
    key: "upDown",
    label: "Up / Down",
    value: valid ? `${Math.round(upPct)}% / ${Math.round(downPct)}%` : "warming…",
    sub: valid
      ? `flat ${Math.round(flatPct)}% • ${valid} assets`
      : `waiting for prevPrice • ${(input.rows || []).length} assets`,
    tone: valid ? upDownTone : "neutral",
    raw: upDownDiff,
  });

  // -------------------------
  // 2) BTC DOMINANCE (hecho real — market-structure)
  // -------------------------
  if (input.dominance) {
    items.push({
      key: "btcDom",
      label: "BTC Dom",
      value: `${input.dominance.btc.toFixed(1)}%`,
      sub: `ETH ${input.dominance.eth.toFixed(1)}%`,
      tone: "neutral",             // dominancia no es buena/mala
      raw: input.dominance.btc,
    });
  }

  // -------------------------
  // 3) FEAR & GREED (hecho real — alternative.me)
  // -------------------------
  if (input.fng) {
    items.push({
      key: "fng",
      label: "Fear & Greed",
      value: `${input.fng.value}`,
      sub: input.fng.label,
      tone: fngTone(input.fng.value),
      raw: input.fng.value,
    });
  }

  // -------------------------
  // 4) MARKET CAP (hecho real — overview, opcional)
  // -------------------------
  if (input.mcap) {
    items.push({
      key: "mcap",
      label: "Mkt Cap",
      value: fmtUsd(input.mcap.totalUsd),
      sub: `24h ${input.mcap.change24h >= 0 ? "+" : ""}${input.mcap.change24h.toFixed(1)}%`,
      tone: input.mcap.change24h >= 0 ? "good" : "bad",
      raw: input.mcap.change24h,
    });
  }

  return { updatedAt: Date.now(), items };
}