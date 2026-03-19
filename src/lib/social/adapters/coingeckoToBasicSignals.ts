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
const ALLOWED_SOCIAL_ASSETS = new Set([
  "BTC", "ETH", "SOL", "XRP", "ADA", "BNB", "DOGE", "POL", "AVAX", "DOT",
  "LINK", "UNI","LTC","USDT","USDC","SHIB","DAI","BCH","XLM","NEAR",
  "VET","TRX","ATOM","SUI","ARB","FTM", "OP","HYPE","PYUSD","TON",
  "OKB","PI","LEO","XMR","USDE","CC","WLFI","HBAR","MNT","PAXG"
]);

function attentionScoreFromRank(rank?: number, index = 0): number {
  const safeRank = typeof rank === "number" && rank > 0 ? rank : 9999;

  const rankComponent =
    safeRank <= 2 ? 92 :
    safeRank <= 5 ? 84 :
    safeRank <= 10 ? 74 :
    safeRank <= 25 ? 60 :
    safeRank <= 50 ? 48 :
    34;

  const positionPenalty = index * 10;

  return Math.max(18, Math.min(100, rankComponent - positionPenalty));
}

function attentionDeltaFromPriceChange(change?: number, index = 0): number {
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

const NARRATIVE_TAGS = new Set([
  "majors-led",
  "layer1",
  "meme",
  "defi",
  "selective breadth",
  "mixed participation",
  "trend expansion",
  "risk-off",
]);

const ASSET_DESCRIPTOR_TAGS = new Set([
  "store-of-value",
  "smart-contracts",
]);

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

  const FALLBACK_ASSETS = ["BTC", "ETH", "SOL"];
  const ALLOWED_SOCIAL_ASSETS = new Set([
  "BTC", "ETH", "SOL", "XRP", "ADA", "BNB", "DOGE", "POL", "AVAX", "DOT",
  "LINK", "UNI","LTC","USDT","USDC","SHIB","DAI","BCH","XLM","NEAR",
  "VET","TRX","ATOM","SUI","ARB","FTM", "OP","HYPE","PYUSD","TON",
  "OKB","PI","LEO","XMR","USDE","CC","WLFI","HBAR","MNT","PAXG"
  ]);

  function ensureMinimumLeaders(leaders: SocialAttentionItem[]): SocialAttentionItem[] {
  const existing = new Set(leaders.map((x) => x.asset));

  const fillers = FALLBACK_ASSETS
    .filter((asset) => !existing.has(asset))
    .map((asset, index) => ({
      asset,
      attentionScore: 45 - index * 5,
      attentionDeltaPct: 0,
      direction: "flat" as const,
      tags: inferTags(asset, asset),
    }));

  return [...leaders, ...fillers].slice(0, 3);
}

  const rawCoins = trending.coins ?? [];
  const filteredLeaders = rawCoins
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
  .filter((x) => !!x.asset && ALLOWED_SOCIAL_ASSETS.has(x.asset))
  .slice(0, 5);
  const leaders = ensureMinimumLeaders(filteredLeaders);


  const topAssets = leaders.slice(0, 3).map((x) => x.asset);
  const rawTags = [...new Set(leaders.flatMap((x) => x.tags ?? []))];

  const narrativeTags = rawTags.filter((tag) => NARRATIVE_TAGS.has(tag));
  const descriptorTags = rawTags.filter((tag) => ASSET_DESCRIPTOR_TAGS.has(tag));
  const tags =
  narrativeTags.length > 0
    ? narrativeTags.slice(0, 4)
    : rawTags.slice(0, 4);
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

const basicSignals = mapCoinGeckoTrendingToBasicSignals({
  trending: mockCoinGeckoTrending,
  window: "1h",
});

console.log("BASIC SIGNALS", basicSignals);