import { NextResponse } from "next/server";
export const runtime = "nodejs";

const TRENDING_URL = "https://api.coingecko.com/api/v3/search/trending";
const REVALIDATE_SECONDS = 600;

export type TrendingCoin = {
  id: string;
  symbol: string;
  name: string;
  rank: number | null;       // market_cap_rank — contexto: rank 2000 != rank 2
  image: string | null;
  price: number | null;
  change24h: number | null;
  sparkline: string | null;  // URL del SVG que CoinGecko ya provee
  marketCap: string | null;  // viene preformateado: "$42,537,178,536"
  volume24h: string | null;
  description: string | null;
};

export async function GET() {
  const ts = new Date().toISOString();
  try {
    const res = await fetch(TRENDING_URL, {
      headers: { accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      // Si algún día este endpoint pasa a requerir key:
      // headers: { accept: "application/json", "x-cg-demo-api-key": process.env.COINGECKO_DEMO_KEY ?? "" },
    });

    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

    const json = await res.json();
    const raw: any[] = Array.isArray(json?.coins) ? json.coins : [];

    const coins: TrendingCoin[] = raw
      .map((entry) => {
        const it = entry?.item ?? {};
        const d = it?.data ?? {};
        const sym = String(it?.symbol ?? "").toUpperCase();
        if (!sym) return null;
        return {
          id: String(it?.id ?? sym),
          symbol: sym,
          name: String(it?.name ?? sym),
          rank: typeof it?.market_cap_rank === "number" ? it.market_cap_rank : null,
          image: it?.large ?? it?.small ?? it?.thumb ?? null,
          price: typeof d?.price === "number" ? d.price : null,
          change24h:
            typeof d?.price_change_percentage_24h?.usd === "number"
              ? d.price_change_percentage_24h.usd
              : null,
          sparkline: d?.sparkline ?? null,
          marketCap: d?.market_cap ?? null,
          volume24h: d?.total_volume ?? null,
          description: d?.content?.description ?? null,
        } as TrendingCoin;
      })
      .filter((c): c is TrendingCoin => c !== null);

    return NextResponse.json({
      ok: true,
      source: "coingecko-search-trending",
      ts,
      total: coins.length,
      coins,
    });
  } catch (e: any) {
    // degradación honesta: sin datos, no datos inventados
    return NextResponse.json({
      ok: false,
      source: "coingecko-search-trending",
      ts,
      total: 0,
      coins: [],
      error: e?.message ?? "trending_error",
    });
  }
}
