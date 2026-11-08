// app/api/cryptolink/compare/route.ts  (BFF)
//
// Passthrough al Java v2 para la serie rebaseada del chart de momentum.
// Mismo patrón que top-movers.

import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function getBaseUrl() {
  return process.env.CRYPTOLINK_API_BASE_URL || "http://localhost:8080";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbols = (searchParams.get("symbols") || "").trim();
    const window = searchParams.get("window") || "7d";
    const fiat = (searchParams.get("fiat") || "USD").toUpperCase();

    if (!symbols) {
      return NextResponse.json({ ok: false, error: "symbols required" }, { status: 400 });
    }

    const qs = new URLSearchParams();
    qs.set("symbols", symbols);
    qs.set("window", window);
    qs.set("fiat", fiat);

    const url = `${getBaseUrl()}/v1/compare?${qs.toString()}`;
    const apiKey = process.env.CRYPTOLINK_DEMO_KEY || "";

    const res = await fetch(url, {
      next: { revalidate: 300 },
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
    return NextResponse.json({ ok: false, error: e?.message ?? "compare_error" }, { status: 500 });
  }
}
