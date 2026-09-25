import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";


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
      `${getBaseUrl()}/internal/v1/symbols?top=100&fiat=USD`
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
