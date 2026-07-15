import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

/**
 * Market 360° — BFF con caché compartido + API key de CoinGecko.
 *
 * PRESUPUESTO REAL (Demo plan): 10,000 calls/mes ≈ 13-14 calls/HORA sostenible.
 * Por eso el TTL es 300s (5 min), NO 60s:
 *   - 60s  -> hasta ~43,000 calls/mes -> REBASA el límite.
 *   - 300s -> ~12 calls/hora -> ~8,600/mes -> dentro del presupuesto.
 * El dato de mercado cambia lento (CoinGecko mismo cachea 1-5 min), así que
 * 5 min de antigüedad es imperceptible. Frescura innecesaria = calls desperdiciados.
 *
 * DISEÑO: Market 360° = TOP FIJO de mercado (no selección del usuario), para que
 * la URL sea estable y el caché sirva a todos con una sola llamada por ventana.
 * La selección de símbolos vive en Prices (que la respeta y ya cachea en el motor).
 *
 * DISTRIBUCIÓN DE API KEY (a decidir con datos del dashboard):
 * Este panel es "pesado/valioso" -> usa API key (100/min estable + pool mensual).
 * Paneles menores podrían ir sin key más adelante, tras medir consumo real.
 */

const REVALIDATE_SECONDS = 300; // 5 min — acorde al presupuesto de 10k/mes

const MARKET_360_TOP = [
  "BTC", "ETH", "USDT", "BNB", "SOL", "USDC", "XRP", "TRX", "HYPE", "DOGE",
  "RAIN", "USDS", "LEO", "ADA", "ZEC", "XLM", "WBT", "XMR", "LINK", "CC", 
  "SUI", "BCH", "GRAM", "DAI", "USD1", "USDE", "LTC", "HBAR", "USDG", "FIGR_HELOC",
  "AVAX", "PYUSD", "CRO", "NEAR", "XAUT", "SHIB", "BUIDL", "USDY", "TAO", "UNI",
  "M", "PAXG", "WLFI", "ASTER", "OKB", "ONDO", "RLUSD", "HTX", "USYC", "USDD"
];

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SOCIAL_LINK_BASE_URL ||
    process.env.CRYPTOLINK_API_BASE_URL ||
    "http://localhost:8080"
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fiat = (searchParams.get("fiat") || "USD").toUpperCase();

    // Símbolos FIJOS (no de la query) -> URL estable -> cacheable
    const symbols = MARKET_360_TOP;

    const url =
      `${getBaseUrl()}/internal/v1/symbols?symbols=${encodeURIComponent(symbols.join(","))}&fiat=${encodeURIComponent(fiat)}`;

    // Header de la app hacia el motor (si aplica)
    const apiKey = process.env.CRYPTOLINK_DEMO_KEY || "";

    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: apiKey ? { "x-api-key": apiKey } : {},
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: res.status });
    } catch {
      return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": contentType },
      });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "symbols_error" }, { status: 500 });
  }
}
