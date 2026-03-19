import { NextResponse } from "next/server";
import {
  mapCoinGeckoTrendingToBasicSignals,
  mockCoinGeckoTrending,
} from "@/lib/social/adapters/coingeckoToBasicSignals";

export async function GET() {
  const result = mapCoinGeckoTrendingToBasicSignals({
    trending: mockCoinGeckoTrending,
    window: "1h",
  });

  console.log("BASIC SIGNALS ROUTE", result);

  return NextResponse.json(result);
}