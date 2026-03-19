import { SocialAttentionItem, SocialLinkBasicSignalsResponse } from "@/lib/social/basicSignalsMock";

type CoinGeckoTrendingCoin = {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank?: number;
    data?: {
      price?: number;
      price_change_percentage_24h?: {
        usd?: number;
      };
      market_cap?: string;
      total_volume?: string;
    };
  };
};

type CoinGeckoTrendingResponse = {
  coins?: CoinGeckoTrendingCoin[];
};

function normalizeSymbol(symbol?: string): string {
  return (symbol ?? "").trim().toUpperCase();
}

function attentionScoreFromRank(rank?: number, index = 0): number {
  // score simple: mejor rank + mejor posición = más score
  const safeRank = typeof rank === "number" && rank > 0 ? rank : 9999;
  const rankBoost = Math.max(0, 100 - Math.min(90, Math.floor(safeRank / 20)));
  const positionBoost = Math.max(0, 18 - index * 4);
  return Math.max(10, Math.min(100, rankBoost + positionBoost));
}

function attentionDeltaFromPriceChange(change?: number, index = 0): number {
  // fallback simple y honesto para esta etapa:
  // si hay cambio 24h úsalo; si no, usa una pendiente artificial pequeña por posición
  if (typeof change === "number" && Number.isFinite(change)) {
    return Number(change.toFixed(2));
  }

  const fallback = 8 - index * 1.5;
  return Number(Math.max(1, fallback).toFixed(2));
}

function directionFromDelta(delta: number): "up" | "down" | "flat" {
  if (delta > 0.1) return "up";
  if (delta < -0.1) return "down";
  return "flat";
}

function inferTags(symbol: string, name?: string): string[] {
  const s = symbol.toUpperCase();
  const n = (name ?? "").toLowerCase();

  const tags: string[] = [];

  if (s === "BTC" || s === "ETH") tags.push("majors-led");
  if (["SOL", "ADA", "AVAX", "ATOM", "NEAR"].includes(s)) tags.push("layer1");
  if (["DOGE", "SHIB", "PEPE", "FLOKI"].includes(s)) tags.push("meme");
  if (["LINK", "UNI", "AAVE", "MKR"].includes(s)) tags.push("defi");
  if (n.includes("bitcoin")) tags.push("store-of-value");
  if (n.includes("ethereum")) tags.push("smart-contracts");

  return [...new Set(tags)];
}

function deriveCoverage(topAssets: string[], tags: string[]): "low" | "moderate" | "broad" {
  if (topAssets.length >= 4 && tags.length >= 4) return "broad";
  if (topAssets.length >= 2 && tags.length >= 2) return "moderate";
  return "low";
}

export function mapCoinGeckoTrendingToBasicSignals(args: {
  trending: CoinGeckoTrendingResponse;
  window?: "15m" | "30m" | "1h" | "4h";
  ts?: string;
}): SocialLinkBasicSignalsResponse {
  const { trending, window = "1h", ts = new Date().toISOString() } = args;
  const basicSignals = mapCoinGeckoTrendingToBasicSignals({
  trending: mockCoinGeckoTrending,
  window: "1h",
});

console.log("BASIC SIGNALS", basicSignals);

  const rawCoins = trending.coins ?? [];

  const leaders: SocialAttentionItem[] = rawCoins
    .map((entry, index) => {
      const item = entry.item;
      const asset = normalizeSymbol(item.symbol);
      const delta = attentionDeltaFromPriceChange(
        item.data?.price_change_percentage_24h?.usd,
        index
      );

      return {
        asset,
        attentionScore: attentionScoreFromRank(item.market_cap_rank, index),
        attentionDeltaPct: delta,
        direction: directionFromDelta(delta),
        tags: inferTags(asset, item.name),
      };
    })
    .filter((x) => !!x.asset)
    .slice(0, 5);

  const topAssets = leaders.slice(0, 3).map((x) => x.asset);

  const tags = [...new Set(leaders.flatMap((x) => x.tags ?? []))].slice(0, 4);

  const coverage = deriveCoverage(topAssets, tags);

  return {
    ok: true,
    source: "coingecko-trending-adapter-v1",
    ts,
    window,
    market: {
      topAssets,
      attentionLeaders: leaders,
      attentionLosers: [],
      tags,
      coverage,
    },
  };
}

export const mockCoinGeckoTrending: CoinGeckoTrendingResponse = {
  coins: [
    {
      item: {
        id: "bitcoin",
        coin_id: 1,
        name: "Bitcoin",
        symbol: "BTC",
        market_cap_rank: 1,
        data: {
          price_change_percentage_24h: {
            usd: 2.4,
          },
        },
      },
    },
    {
      item: {
        id: "solana",
        coin_id: 4128,
        name: "Solana",
        symbol: "SOL",
        market_cap_rank: 5,
        data: {
          price_change_percentage_24h: {
            usd: 5.1,
          },
        },
      },
    },
    {
      item: {
        id: "ethereum",
        coin_id: 1027,
        name: "Ethereum",
        symbol: "ETH",
        market_cap_rank: 2,
        data: {
          price_change_percentage_24h: {
            usd: 1.6,
          },
        },
      },
    },
  ],
};
