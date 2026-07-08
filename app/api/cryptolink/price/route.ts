import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

/**
 * /api/cryptolink/price — precio de UN símbolo (endpoint fijo del back /v1/price).
 *
 * CACHÉ: usa el Data Cache de Next (revalidate 15s), NO el Map en memoria por
 * proceso (que no funciona en Vercel serverless: cada invocation puede ser otro
 * proceso y el Map casi nunca acierta).
 *
 * POR QUÉ ESTO RESUELVE EL N=N:
 * Overview pide siempre los mismos símbolos fijos (BTC, ETH) -> URLs estables
 * (?symbol=BTC, ?symbol=ETH). Con revalidate 15s, N visitantes concurrentes
 * comparten UNA llamada al Java por símbolo cada 15s, en vez de N llamadas.
 * Rompe el "N visitantes = N llamadas" que topaba Vercel y saturaba el Java.
 * Misma frescura que el polling actual (15s), pero compartida.
 *
 * NOTA API KEY: el caché de Next cachea por URL. La key va en el header (no en
 * la URL), así que NO fragmenta el caché por key -> todos los visitantes
 * comparten la misma entrada cacheada. La key del portal se inyecta server-side
 * (nunca llega al navegador).
 */

const REVALIDATE_SECONDS = 15;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = (searchParams.get("symbol") || "BTC").toUpperCase();
    const fiat = (searchParams.get("fiat") || "USD").toUpperCase();

    // Key del portal, server-side (no se expone al navegador).
    // Si el front la manda por header la respetamos; si no, la del entorno.
    const apiKey = req.headers.get("x-api-key")?.trim() || process.env.CRYPTOLINK_DEMO_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing x-api-key" }, { status: 401 });
    }

    const base = process.env.CRYPTOLINK_API_BASE || "http://localhost:8080";
    const url = `${base}/v1/price?symbol=${encodeURIComponent(symbol)}&fiat=${encodeURIComponent(fiat)}`;

    // CAMBIO CENTRAL: revalidate de Next en vez del Map en memoria.
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { "x-api-key": apiKey },
    });

    const body = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": contentType },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "proxy_error" }, { status: 500 });
  }
}
