import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function getBaseUrl() {
  return process.env.CRYPTOLINK_API_BASE_URL || "http://localhost:8080";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fiat = (searchParams.get("fiat") || "USD").toUpperCase();

    const url = `${getBaseUrl()}/v1/overview?fiat=${encodeURIComponent(fiat)}`;
    const apiKey = process.env.CRYPTOLINK_DEMO_KEY || "";

    const res = await fetch(url, {
      next: { revalidate: 60 },   // overview cambia lento (data horaria)
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
    return NextResponse.json({ ok: false, error: e?.message ?? "overview_error" }, { status: 500 });
  }
}