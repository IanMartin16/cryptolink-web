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


    function normalizeScore(raw: number, factor: number, floor = 0) {
      if (!raw || raw <= 0) return 0;
      return Math.min(100, Math.max(floor, Math.round(raw * factor)));
    }

    const trendItems = trends?.items ?? [];
    const momentumItems = momentum?.momentum ?? [];
    const moverGainers = movers?.gainers ?? [];
    const moverLosers = movers?.losers ?? [];
    const regimeObj = regime?.regime ?? null;

    const trendAvg =
      trendItems.length > 0
        ? trendItems.reduce((acc: number, x: any) => acc + Number(x.score ?? 0), 0) / trendItems.length
        : 0;

    const momentumAvg =
      momentumItems.length > 0
        ? momentumItems.reduce((acc: number, x: any) => acc + Number(x.score ?? 0), 0) / momentumItems.length
        : 0;

    const allMovers = [...moverGainers, ...moverLosers];

    const avgMoverIntensity =
      allMovers.length > 0
        ? allMovers.reduce((acc: number, x: any) => acc + Math.abs(Number(x.changePct ?? 0)), 0) / allMovers.length
        : 0;

      // calibración más suave
    const trendScore = normalizeScore(trendAvg, 35, 8);
    const momentumScore = normalizeScore(momentumAvg, 70, 8);
    const moversScore = normalizeScore(avgMoverIntensity, 120, 10);
    const regimeScore = regimeObj
       ? Math.min(100, Math.max(8, Math.round(Number(regimeObj.confidence ?? 0) * 100)))
       : 0;

    return NextResponse.json({
      ok: true,
      ts: new Date().toISOString(),
      fiat,
      signals: [
        { label: "Trend", value: trendScore },
        { label: "Mom", value: momentumScore },
        { label: "Move", value: moversScore },
        { label: "Reg", value: regimeScore },
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