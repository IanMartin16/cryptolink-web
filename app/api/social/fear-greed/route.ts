// app/api/social/fear-greed/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
const REVALIDATE = 1800; // diario → 30 min

const base = () =>
  process.env.NEXT_PUBLIC_SOCIAL_LINK_BASE_URL || process.env.CRYPTOLINK_API_BASE_URL || "http://localhost:8080";

export async function GET(req: NextRequest) {
  try {
    const window = new URL(req.url).searchParams.get("window") || "30d";
    const apiKey = process.env.CRYPTOLINK_DEMO_KEY || "";
    const res = await fetch(`${base()}/internal/v1/fear-greed?window=${encodeURIComponent(window)}`,
      { next: { revalidate: REVALIDATE }, headers: apiKey ? { "x-api-key": apiKey } : {} });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return new NextResponse(text, { status: res.status, headers: { "content-type": "application/json" } }); }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "fear_greed_error" }, { status: 500 });
  }
}