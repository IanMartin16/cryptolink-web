// app/api/social/insights/collapse-risk/route.ts  (BFF)
//
// Passthrough a social_link, clon exacto del route de attention.
// social_link se queda interno; el BFF es la cara pública.

import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

const REVALIDATE_SECONDS = 3600; // 1h — la base rate cambia lento

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SOCIAL_LINK_BASE_URL ||
    process.env.CRYPTOLINK_API_BASE_URL ||
    "http://localhost:8080"
  );
}

export async function GET(_req: NextRequest) {
  try {
    const url = `${getBaseUrl()}/internal/v1/insights/collapse-risk`;
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
      return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": contentType },
      });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "collapse_risk_error" }, { status: 500 });
  }
}
