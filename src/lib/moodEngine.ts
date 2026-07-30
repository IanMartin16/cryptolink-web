import type { PriceRow } from "./types";

export type TrendItem = {
  symbol: string;
  trend: "up" | "down" | "flat";
  score: number;
};

function pct(row?: PriceRow) {
  if (!row || typeof row.price !== "number" || typeof row.prevPrice !== "number" || row.prevPrice === 0) return 0;
  return ((row.price - row.prevPrice) / row.prevPrice) * 100;
}

/**
 * computeMood v2 — usa los 20 símbolos de la rotación, no solo BTC/ETH.
 *
 * Problemas de v1 que se corrigen:
 *  1. priceSignal solo usaba BTC/ETH -> ignoraba 18 símbolos. Ahora usa todos,
 *     con un peso extra a BTC/ETH (siguen siendo referencia, pero no lo único).
 *  2. El promedio de trends cancelaba subidas con bajadas -> neutral. Ahora se
 *     mide DIRECCIÓN DOMINANTE + INTENSIDAD (breadth), no la media neta.
 *  3. BTC/ETH se mueven poco -> mood plano. Al incluir los 18 que sí se mueven,
 *     el mood refleja la acción real (la misma que Market Intelligence detecta).
 */
export function computeMood(rows: PriceRow[], trends: TrendItem[]) {
  // --- señal de precio: TODOS los símbolos, con sesgo a BTC/ETH como referencia ---
  const priced = rows
    .map((r) => ({ symbol: r.symbol, p: pct(r) }))
    .filter((x) => Number.isFinite(x.p));

  let priceSignal = 0;
  if (priced.length) {
    // peso: BTC/ETH cuentan 2x (referencia), el resto 1x. Media ponderada.
    let wSum = 0;
    let acc = 0;
    for (const { symbol, p } of priced) {
      const w = symbol === "BTC" || symbol === "ETH" ? 2 : 1;
      acc += w * p;
      wSum += w;
    }
    priceSignal = wSum ? acc / wSum : 0;
  }

  // --- breadth: cuántos suben vs bajan (dirección dominante, NO promedio que se cancela) ---
  // Esto captura "el mercado se mueve en conjunto" aunque el promedio neto sea ~0.
  const movers = priced.filter((x) => Math.abs(x.p) > 0.05); // umbral de ruido
  const up = movers.filter((x) => x.p > 0).length;
  const down = movers.filter((x) => x.p < 0).length;
  const totalMovers = up + down;
  // breadth en -1..1: +1 todos suben, -1 todos bajan, 0 dividido
  const breadth = totalMovers ? (up - down) / totalMovers : 0;

  // --- intensidad: qué tan fuerte se mueve el mercado (media de |cambios|) ---
  const intensity = movers.length
    ? movers.reduce((a, x) => a + Math.abs(x.p), 0) / movers.length
    : 0;

  // --- señal de trends: dirección dominante ponderada por score (no media neta) ---
  let trendSignal = 0;
  if (trends?.length) {
    const withScore = trends.filter((t) => Number.isFinite(t.score));
    if (withScore.length) {
      const upScore = withScore.filter((t) => t.trend === "up").reduce((a, t) => a + (t.score ?? 0), 0);
      const downScore = withScore.filter((t) => t.trend === "down").reduce((a, t) => a + (t.score ?? 0), 0);
      const totalScore = upScore + downScore || 1;
      trendSignal = (upScore - downScore) / totalScore; // -1..1
    }
  }

  // --- combinación: precio + breadth (con intensidad) + trends ---
  // breadth*intensity captura "movimiento direccional fuerte" que el promedio ocultaba.
  const scoreRaw =
    priceSignal * 8 +               // media ponderada de precios
    breadth * intensity * 12 +      // dirección dominante amplificada por fuerza
    trendSignal * 20;               // sesgo de trends (ya normalizado -1..1)

  const score = Math.max(-100, Math.min(100, scoreRaw));

  // --- coverage / confidence (igual espíritu que v1, sobre TODOS los símbolos) ---
  const totalRows = rows.length || 1;
  const priceCoverage = priced.length / totalRows;

  const totalTrends = trends.length || 1;
  const trendSignals = trends.filter((t) => Number.isFinite(t.score)).length;
  const trendCoverage = trendSignals / totalTrends;

  const confidence = Math.max(
    0.25,
    Math.min(0.95, 0.15 + 0.65 * priceCoverage + 0.20 * trendCoverage)
  );

  return { score, confidence };
}