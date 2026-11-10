// app/api/social/market-structure/route.ts  (BFF)
//
// Passthrough a social_link. Dominancia + distancia al ATH del top100.

import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

const REVALIDATE_SECONDS = 300; // horario → cambia lento

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
    const window = searchParams.get("window") || "30d";

    const url = `${getBaseUrl()}/internal/v1/market-structure?window=${encodeURIComponent(window)}`;
    const apiKey = process.env.CRYPTOLINK_DEMO_KEY || "";

    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: apiKey ? { "x-api-key": apiKey } : {},
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return new NextResponse(text, { status: res.status, headers: { "content-type": contentType } });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "market_structure_error" }, { status: 500 });
  }
}
