"use client";

import { useEffect, useRef, useState } from "react";

const history: Record<string, number[]> = {};

// 🔑 la clave ahora incluye fiat: "BTC:USD" ≠ "BTC:MXN"
function histKey(symbol: string, fiat: string) {
  return `${symbol.toUpperCase()}:${fiat.toUpperCase()}`;
}

export function pushPriceHistory(symbol: string, fiat: string, price: number, max = 600) {
  const key = histKey(symbol, fiat);
  const arr = history[key] ?? (history[key] = []);
  arr.push(price);
  if (arr.length > max) arr.splice(0, arr.length - max);
}

export function getPriceHistory(symbol: string, fiat: string): number[] {
  return history[histKey(symbol, fiat)] ?? [];
}

export function usePriceHistory(symbol: string, fiat: string, price?: number, maxPoints = 600) {
  const [values, setValues] = useState<number[]>([]);
  const last = useRef<number | undefined>(undefined);

  // ✅ resetea cuando cambia symbol O fiat
  useEffect(() => {
    setValues([]);
    last.current = undefined;
  }, [symbol, fiat]);

  useEffect(() => {
    if (typeof price !== "number") return;
    if (last.current === price) return;

    last.current = price;
    pushPriceHistory(symbol, fiat, price, maxPoints);

    setValues((prev) => {
      const next = [...prev, price];
      if (next.length > maxPoints) next.splice(0, next.length - maxPoints);
      return next;
    });
  }, [price, maxPoints, symbol, fiat]);

  return values;
}

const hydrated = new Set<string>();

export async function hydratePriceHistory(symbols: string[], fiat: string): Promise<void> {
  const pending = symbols
    .map((s) => s.toUpperCase())
    .filter((s) => !hydrated.has(histKey(s, fiat)));
  if (pending.length === 0) return;

  try {
    // ruta RELATIVA del BFF (no necesita env pública; el route usa la env de servidor)
    const url = `/api/cryptolink/spark?symbols=${encodeURIComponent(pending.join(","))}&fiat=${encodeURIComponent(fiat)}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return;

    const data = await res.json();
    const series = data?.series ?? {};

    for (const sym of pending) {
      const key = histKey(sym, fiat);
      const points = series[sym];
      if (!Array.isArray(points) || points.length === 0) {
        hydrated.add(key);
        continue;
      }

      const values = points
        .map((p: any) => (typeof p?.v === "number" ? p.v : null))
        .filter((v: number | null): v is number => v !== null);

      // ANTES: if ((history[key]?.length ?? 0) === 0) { history[key] = values.slice(-600); }
      // AHORA: si el endpoint trae MÁS historia que lo que el feed alcanzó a acumular,
      // usamos la del endpoint como base y le APPENDeamos lo poco que el feed metió
      // (para no perder los puntos vivos recién llegados).
      const existing = history[key] ?? [];
      if (values.length > existing.length) {
        // combinar: historia persistente (base) + lo que el feed acumuló encima
        const merged = [...values, ...existing];
        history[key] = merged.slice(-600);
      }
      // si existing ya tenía más (raro al recargar), se deja como está

      hydrated.add(key);
    }

  } catch {
    // best-effort: si falla, el feed en vivo sigue como hoy
  }
}