import { NextResponse } from "next/server";
import {
  mapCoinGeckoTrendingToBasicSignals,
  mockCoinGeckoTrending,
} from "@/lib/social/adapters/coingeckoToBasicSignals";

const COINGECKO_TRENDING_URL = "https://api.coingecko.com/api/v3/search/trending";

export async function GET() {
  try {
    const res = await fetch(COINGECKO_TRENDING_URL, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`CoinGecko HTTP ${res.status}`);
    }

    const trending = await res.json();

    const result = mapCoinGeckoTrendingToBasicSignals({
      trending,
      window: "1h",
      ts: new Date().toISOString(),
    });

    console.log("BASIC SIGNALS REAL", result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.warn("CoinGecko fallback to mock:", error?.message ?? error);

    const fallback = mapCoinGeckoTrendingToBasicSignals({
      trending: mockCoinGeckoTrending,
      window: "1h",
      ts: new Date().toISOString(),
    });

    return NextResponse.json(fallback);
  }
}