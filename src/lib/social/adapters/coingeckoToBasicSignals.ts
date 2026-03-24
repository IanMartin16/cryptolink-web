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

function deriveCoverage(args: {
  leaders: SocialAttentionItem[];
  losers: SocialAttentionItem[];
  tags: string[];
}): "low" | "moderate" | "broad" {
  const { leaders, losers, tags } = args;

  const totalSignals = leaders.length + losers.length;
  const tagCount = tags.length;

  if (leaders.length >= 4 && losers.length >= 2 && tagCount >= 3) {
    return "broad";
  }

  if (leaders.length >= 3 && totalSignals >= 4 && tagCount >= 2) {
    return "moderate";
  }

  return "low";
}

export function mapCoinGeckoTrendingToBasicSignals(args: {
  trending: CoinGeckoTrendingResponse;
  window?: "15m" | "30m" | "1h" | "4h";
  ts?: string;
}): SocialLinkBasicSignalsResponse {
  const { trending, window = "1h", ts = new Date().toISOString() } = args;

  const NARRATIVE_PRIORITY_ASSETS = [
  "BTC","ETH","SOL","DOGE","SHIB","XRP","ADA","AVAX","LINK","UNI",
  ];

  function buildAttentionLosers(args: {
    leaders: SocialAttentionItem[];
    topAssets: string[];
    limit?: number;
  }): SocialAttentionItem[] {
    const { leaders, topAssets, limit = 2 } = args;

    const leaderSet = new Set(leaders.map((x) => x.asset));
    const topSet = new Set(topAssets);

    const candidates = NARRATIVE_PRIORITY_ASSETS
      .filter((asset) => !leaderSet.has(asset) && !topSet.has(asset))
      .slice(0, limit);

    return candidates.map((asset, index) => ({
      asset,
      attentionScore: Math.max(18, 30 - index * 4),
      attentionDeltaPct: Number((-3.5 - index * 1.2).toFixed(2)),
      direction: "down" as const,
      tags: inferTags(asset, asset),
    }));
  }

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
  const attentionLosers = buildAttentionLosers({
    leaders,
    topAssets,
    limit: 2,
  });

  const rawTags = [
    ...new Set([
      ...leaders.flatMap((x) => x.tags ?? []),
      ...attentionLosers.flatMap((x) => x.tags ?? []),
    ]),
  ];
  const marketTags = buildMarketNarrativeTags({ leaders, losers: attentionLosers });
  const filteredRawTags = rawTags.filter((tag) => NARRATIVE_TAGS.has(tag));
  const tags = [...new Set([...marketTags, ...filteredRawTags])].slice(0, 4);
  
  const coverage = deriveCoverage({leaders, losers: attentionLosers, tags});

  return {
    ok: true,
    source: "coingecko-trending-adapter-v1",
    ts,
    window,
    market: {
      topAssets,
      attentionLeaders: leaders,
      attentionLosers,
      tags,
      coverage,
    },
  };
}

function buildMarketNarrativeTags(args: {
  leaders: SocialAttentionItem[];
  losers: SocialAttentionItem[];
}): string[] {
  const { leaders, losers } = args;

  const tags: string[] = [];

  const leaderAssets = leaders.map((x) => x.asset);
  const loserAssets = losers.map((x) => x.asset);

  const leaderMajors = leaderAssets.filter(isMajorAsset).length;
  const leaderMemes = leaderAssets.filter(isMemeAsset).length;
  const leaderLayer1 = leaderAssets.filter(isLayer1Asset).length;
  const leaderDefi = leaderAssets.filter(isDefiAsset).length;

  const loserMajors = loserAssets.filter(isMajorAsset).length;
  const loserMemes = loserAssets.filter(isMemeAsset).length;

  // liderazgo de majors
  if (leaderMajors >= 1) tags.push("majors-led");

  // breadth / participation
  if (leaders.length >= 3) tags.push("selective breadth");
  if (leaders.length >= 4) tags.push("broad participation");

  // mezcla de sectores
  const sectorKinds =
    Number(leaderMajors > 0) +
    Number(leaderLayer1 > 0) +
    Number(leaderMemes > 0) +
    Number(leaderDefi > 0);

  if (sectorKinds >= 2) tags.push("mixed participation");
  if (sectorKinds >= 3) tags.push("trend expansion");

  // sesgo risk-off simple
  if (leaderMajors >= 1 && loserMemes >= 1) tags.push("risk-off");

  // si el liderazgo viene más de meme
  if (leaderMemes >= 1 && leaderMajors === 0) tags.push("meme-led");

  // si domina L1
  if (leaderLayer1 >= 2) tags.push("layer1 rotation");

  // si majors están perdiendo foco
  if (loserMajors >= 1 && leaderMajors === 0) tags.push("weak major participation");

  return [...new Set(tags)].slice(0, 4);
}

function isMajorAsset(asset: string): boolean {
  return asset === "BTC" || asset === "ETH";
}

function isMemeAsset(asset: string): boolean {
  return ["DOGE", "SHIB", "PEPE", "FLOKI"].includes(asset);
}

function isLayer1Asset(asset: string): boolean {
  return ["SOL", "ADA", "AVAX", "ATOM", "NEAR"].includes(asset);
}

function isDefiAsset(asset: string): boolean {
  return ["LINK", "UNI", "AAVE", "MKR"].includes(asset);
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

