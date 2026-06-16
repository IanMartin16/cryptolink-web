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