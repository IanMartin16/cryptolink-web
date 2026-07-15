import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

/**
 * /api/cryptolink/prices — precios de N símbolos (selección: Watchlist/Top Movers,
 * y derivados vía usePricesFeed en Market Intelligence, dashboard, market360, etc.)
 *
 * CAMBIO (Oportunidad 2 — aliviar el Java):
 * ANTES: Promise.all de N llamadas a /v1/price (una por símbolo) -> 7 símbolos = 7
 *        llamadas simultáneas al Java. Multiplicaba la carga.
 * AHORA: UNA sola llamada a /v1/prices (que acepta CSV de símbolos, ya validado
 *        por plan en el back) -> 7 símbolos = 1 llamada al Java.
 *
 * El SHAPE DE SALIDA se preserva EXACTO (data: [{symbol, ok, data, cache}]) para
 * que fetchPricesBatch/usePricesFeed y los 6 consumidores no noten diferencia.
 * La selección se conserva; solo cambia cómo el route obtiene los datos.
 */

export async function GET(req: NextRequest) {
  try {
    const headerKey = req.headers.get("x-api-key") || "";
    const apiKey = headerKey || process.env.CRYPTOLINK_DEMO_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing x-api-key" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get("symbols") || "BTC,ETH";
    const fiat = (searchParams.get("fiat") || "USD").toUpperCase();

    const symbols = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 50); // seguridad

    const base = process.env.CRYPTOLINK_API_BASE || "http://localhost:8080";

    // UNA sola llamada a /v1/prices (plural) con todos los símbolos
    const url = `${base}/v1/prices?symbols=${encodeURIComponent(symbols.join(","))}&fiat=${encodeURIComponent(fiat)}`;
    const res = await fetch(url, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });

    const text = await res.text();
    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    // /v1/prices devuelve: { ok, fiat, ts, source, prices: { BTC: 12345, ETH: 678, ... } }
    const pricesMap: Record<string, number> = payload?.prices ?? {};
    const upstreamOk = res.ok && payload?.ok === true;
    const source = payload?.source;
    const ts = payload?.ts ?? new Date().toISOString();

    // Reconstruir el MISMO shape que el fan-out entregaba antes:
    // data: [{ symbol, ok, data: {ok, price, source, ts, symbol, fiat}, cache }]
    const data = symbols.map((sym) => {
      const price = pricesMap[sym];
      const hasPrice = typeof price === "number";
      return {
        symbol: sym,
        ok: upstreamOk && hasPrice,
        data: {
          ok: upstreamOk && hasPrice,
          price: hasPrice ? price : null,
          source,
          ts,
          symbol: sym,
          fiat,
        },
        // ya no hay caché por-proceso; marcamos MISS para no mentir sobre HIT
        cache: "MISS" as const,
      };
    });

    return NextResponse.json(
      { ok: true, ts, fiat, data },
      { headers: { "x-bff-cache": "SINGLE" } }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "proxy_error" }, { status: 500 });
  }
}
