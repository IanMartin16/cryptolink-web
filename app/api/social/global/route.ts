import { NextResponse } from "next/server";
export const runtime = "nodejs";
import type { GlobalMarket, GlobalDominance } from "@/lib/types";
/**
 * /api/social/global — Market Global (macro del mercado entero).
 *
 * Fuente: /global de CoinGecko (KEYLESS). Trae la vista de "10,000 pies" que
 * ninguna otra pieza del portal tiene: market cap total, volumen total, y la
 * DOMINANCIA por market cap. Cambia lento (ventana ~10min) -> revalidate 600s,
 * una llamada compartida por todos los visitantes.
 *
 * Solo se extrae lo con uso claro (mcap total + 24h, volumen total + 24h,
 * dominancia, y un par de métricas de ecosistema). Se descarta el ruido: las
 * decenas de fiats de referencia, ICOs, etc. No inventa: si falla, degrada.
 */

const GLOBAL_URL = "https://api.coingecko.com/api/v3/global";
const REVALIDATE_SECONDS = 600;


export async function GET() {
  const ts = new Date().toISOString();
  try {
    const res = await fetch(GLOBAL_URL, {
      headers: { accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

    const json = await res.json();
    const d = json?.data ?? {};

    const dominance: GlobalDominance[] = Object.entries(d?.market_cap_percentage ?? {})
      .map(([symbol, pct]) => ({
        symbol: symbol.toUpperCase(),
        pct: typeof pct === "number" ? pct : Number(pct),
      }))
      .filter((x) => Number.isFinite(x.pct))
      .sort((a, b) => b.pct - a.pct);

    const out: GlobalMarket = {
      marketCapUsd: numOrNull(d?.total_market_cap?.usd),
      marketCapChange24h: numOrNull(d?.market_cap_change_percentage_24h_usd),
      volumeUsd: numOrNull(d?.total_volume?.usd),
      volumeChange24h: numOrNull(d?.volume_change_percentage_24h_usd),
      dominance,
      activeCryptos: numOrNull(d?.active_cryptocurrencies),
      markets: numOrNull(d?.markets),
      ts,
    };

    return NextResponse.json({ ok: true, source: "coingecko-global", data: out });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      source: "coingecko-global",
      data: null,
      error: e?.message ?? "global_error",
      ts,
    });
  }
}

function numOrNull(v: any): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
