export type SocialAttentionItem = {
  asset: string;
  attentionScore: number;
  attentionDeltaPct: number;
  direction: "up" | "down" | "flat";
  tags?: string[];
};

export type MarketBackdrop = {
  fearGreedValue?: number;
  fearGreedLabel?: string;
  source?: string;
  ts?: string;
}

export type SocialLinkBasicSignalsResponse = {
  ok: boolean;
  source: string;
  ts: string;
  window: "15m" | "30m" | "1h" | "4h";
  market: {
    topAssets: string[];
    attentionLeaders: SocialAttentionItem[];
    attentionLosers: SocialAttentionItem[];
    tags: string[];
    coverage: "low" | "moderate" | "broad";
  };
  backdrop?: MarketBackdrop;
};

export const socialLinkBasicSignalsMock: SocialLinkBasicSignalsResponse = {
  ok: true,
  source: "sociallink-basic-v1",
  ts: new Date().toISOString(),
  window: "1h",
  market: {
    topAssets: ["BTC", "ETH", "SOL"],
    attentionLeaders: [
      {
        asset: "BTC",
        attentionScore: 82,
        attentionDeltaPct: 14.2,
        direction: "up",
        tags: ["etf", "majors-led"],
      },
      {
        asset: "SOL",
        attentionScore: 67,
        attentionDeltaPct: 10.8,
        direction: "up",
        tags: ["layer1", "momentum"],
      },
    ],
    attentionLosers: [
      {
        asset: "DOGE",
        attentionScore: 28,
        attentionDeltaPct: -6.4,
        direction: "down",
        tags: ["meme", "cooldown"],
      },
    ],
    tags: ["majors-led", "selective breadth", "etf"],
    coverage: "moderate",
  },
};