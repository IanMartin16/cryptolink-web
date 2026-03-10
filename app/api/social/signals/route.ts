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

async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbols = parseSymbols(searchParams.get("symbols"));
    const fiat = (searchParams.get("fiat") || "MXN").toUpperCase();
    const qs = encodeURIComponent(symbols.join(","));

    const origin = req.nextUrl.origin;

    const [trends, momentum, regime, movers] = await Promise.all([
      getJson(`${origin}/api/social/trends?symbols=${qs}&fiat=${fiat}`),
      getJson(`${origin}/api/social/momentum?symbols=${qs}&fiat=${fiat}`),
      getJson(`${origin}/api/social/regime?symbols=${qs}&fiat=${fiat}`),
      getJson(`${origin}/api/social/movers?symbols=${qs}&fiat=${fiat}`),
    ]);

    const trendItems = trends?.items ?? [];
    const momentumItems = momentum?.momentum ?? [];
    const moverGainers = movers?.gainers ?? [];
    const moverLosers = movers?.losers ?? [];
    const regimeObj = regime?.regime ?? null;

    const trendScore =
      trendItems.length > 0
        ? Math.min(
            100,
            Math.round(
              (trendItems.reduce((acc: number, x: any) => acc + Number(x.score ?? 0), 0) /
                trendItems.length) *
                100
            )
          )
        : 0;

    const momentumScore =
      momentumItems.length > 0
        ? Math.min(
            100,
            Math.round(
              (momentumItems.reduce((acc: number, x: any) => acc + Number(x.score ?? 0), 0) /
                Math.max(1, momentumItems.length)) *
                100
            )
          )
        : 0;

    const moversScore = Math.min(
      100,
      (moverGainers.length + moverLosers.length) * 20
    );

    const regimeScore = regimeObj
      ? Math.min(100, Math.round(Number(regimeObj.confidence ?? 0) * 100))
      : 0;

    return NextResponse.json({
      ok: true,
      ts: new Date().toISOString(),
      fiat,
      signals: [
        { label: "Trends", value: trendScore },
        { label: "Momentum", value: momentumScore },
        { label: "Movers", value: moversScore },
        { label: "Regime", value: regimeScore },
      ],
      raw: {
        trends,
        momentum,
        movers,
        regime,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "signals_error" },
      { status: 500 }
    );
  }
}