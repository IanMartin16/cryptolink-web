// app/api/top-movers/route.ts  (Next.js App Router — BFF proxy)
//
// Mismo patrón que /api/overview: la API Java va con x-api-key del lado servidor,
// el front solo pega a /api/top-movers.

import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function getBaseUrl() {
  return process.env.CRYPTOLINK_API_BASE_URL || "http://localhost:8080";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const window = searchParams.get("window") || "24h";
    const limit = searchParams.get("limit") || "10";
    const fiat = (searchParams.get("fiat") || "USD").toUpperCase();

    const url =
      `${getBaseUrl()}/v1/top-movers` +
      `?window=${encodeURIComponent(window)}` +
      `&limit=${encodeURIComponent(limit)}` +
      `&fiat=${encodeURIComponent(fiat)}`;

    const apiKey = process.env.CRYPTOLINK_DEMO_KEY || "";

    const res = await fetch(url, {
      next: { revalidate: 60 },   // top-movers cambia lento (job histórico horario)
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
    return NextResponse.json({ ok: false, error: e?.message ?? "top_movers_error" }, { status: 500 });
  }
}
