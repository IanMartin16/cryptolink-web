// app/api/social/regime/route.ts  (BFF)
//
// CAMBIO: ya NO se fuerza "BTC,ETH,SOL" por default. Si el cliente no manda
// symbols, se reenvía SIN symbols → el Java calcula sobre el universo activo.
// Mandar symbols sigue soportado (vista específica).

import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

function getBaseUrl() {
  return process.env.CRYPTOLINK_API_BASE_URL || "http://localhost:8080";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // vacío = universo (no default a majors)
    const raw = (searchParams.get("symbols") || "").trim();
    const symbols = raw
      ? raw.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean).slice(0, 100)
      : [];
    const fiat = (searchParams.get("fiat") || "USD").toUpperCase();

    const qs = new URLSearchParams();
    if (symbols.length) qs.set("symbols", symbols.join(",")); // omitido = universo en el Java
    qs.set("fiat", fiat);

    const url = `${getBaseUrl()}/v1/regime?${qs.toString()}`;
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
    return NextResponse.json({ ok: false, error: e?.message ?? "regime_error" }, { status: 500 });
  }
}
