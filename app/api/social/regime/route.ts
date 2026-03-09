import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function parseSymbols(raw: string | null): string[] {
  const arr = (raw || "BTC,ETH,SOL")
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 60);

  return arr.length ? arr : ["BTC", "ETH", "SOL"];
}

function getBaseUrl() {
  return process.env.CRYPTOLINK_API_BASE_URL || "http://localhost:8080";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbols = parseSymbols(searchParams.get("symbols"));
    const fiat = (searchParams.get("fiat") || "MXN").toUpperCase();

    const url =
      `${getBaseUrl()}/v1/regime?symbols=${encodeURIComponent(symbols.join(","))}&fiat=${encodeURIComponent(fiat)}`;

    const apiKey = process.env.CRYPTOLINK_DEMO_KEY || "";
    const res = await fetch(url, {
      cache: "no-store",
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
    return NextResponse.json({ ok: false, error: e?.message ?? "regime_error" }, { status: 500 });
  }
}