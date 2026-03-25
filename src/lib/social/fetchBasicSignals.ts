import type { MarketBackdrop } from "@/lib/social/basicSignalsMock";


function buildQuery(args?: {
  window?: "15m" | "30m" | "1h" | "4h";
  assets?: string[];
  limit?: number;
}) {
  const params = new URLSearchParams();

  if (args?.window) params.set("window", args.window);
  if (args?.assets?.length) params.set("assets", args.assets.join(","));
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export type SocialAttentionItem = {
  asset: string;
  attentionScore: number;
  attentionDeltaPct: number;
  direction: "up" | "down";
  tags: string[];
};

export type BasicSignalsResponse = {
  attentionLeaders: SocialAttentionItem[];
  attentionLosers: SocialAttentionItem[];
  tags: string[];
  coverage: "low" | "moderate" | "high";
  market: {
    topAssets: string[];
    attentionLeaders: SocialAttentionItem[];
    attentionLosers: SocialAttentionItem[];
    tags: string[];
    coverage: "low" | "moderate" | "broad";
  };
  backdrop?: MarketBackdrop;
};

export async function fetchBasicSignals(params: {
  window?: "15m" | "30m" | "1h" | "4h";
  assets?: string[];
  limit?: number;
}): Promise<BasicSignalsResponse> {
  const qs = buildQuery(params);

  const remoteBase = process.env.NEXT_PUBLIC_SOCIAL_LINK_BASE_URL;
  const remoteUrl = remoteBase
    ? `${remoteBase}/internal/v1/basic-signals${qs}`
    : null;

  const localUrl = `/api/social/basic-signals${qs}`;

  // 1) intenta Railway
  if (remoteUrl) {
    try {
      const remoteRes = await fetch(remoteUrl, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      });

      if (!remoteRes.ok) {
        throw new Error(`remote basic-signals HTTP ${remoteRes.status}`);
      }

      const remoteData: BasicSignalsResponse = await remoteRes.json();
      return remoteData;
    } catch (error) {
      console.error("basic-signals remote fetch failed", error);
      console.log("🚀 Data desde Railway:", remoteUrl);
    }
  }

  // 2) fallback local
  const localRes = await fetch(localUrl, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!localRes.ok) {
    throw new Error(`local basic-signals HTTP ${localRes.status}`);
  }

  const localData: BasicSignalsResponse = await localRes.json();
  return localData;
}