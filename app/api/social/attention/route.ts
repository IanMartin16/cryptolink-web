import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

const REVALIDATE_SECONDS = 300; // 5 min — la atención cambia lento (job cada 10min)

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
    const limit = searchParams.get("limit") || "15";

    const url = `${getBaseUrl()}/internal/v1/attention?limit=${encodeURIComponent(limit)}`;
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
    return NextResponse.json({ ok: false, error: e?.message ?? "attention_error" }, { status: 500 });
  }
}