export type NarrativeState = "bullish" | "bearish" | "mixed" | "neutral";
export type NarrativeBreadth = "weak" | "selective" | "broad";
export type NarrativeConfidence = "low" | "moderate" | "strong";
export type NarrativeLeadership = "concentrated" | "distributed" | "mixed";

export type LiveNarrative = {
  headline: string;
  subline: string;
  themes: string[];
  focusAssets: string[];
  note?: string;
  state: NarrativeState;
  confidence: NarrativeConfidence;
  breadth: NarrativeBreadth;
  leadership: NarrativeLeadership;
  sourceType: "derived";
  updatedAt: string;
};

export type LiveNarrativeInput = {
  socialPulse: {
    state: "bullish" | "bearish" | "mixed" | "neutral";
    score: number;
    breadth: "broad" | "selective" | "low";
    conviction: "strong" | "moderate" | "low";
    leadership: "concentrated" | "distributed" | "mixed";
    summary: string;
    topAssets: string[];
    tags: string[];
  };
  trends: {
    up: number;
    down: number;
    flat: number;
    avgScore: number;
    topSymbols: string[];
  };
  mood?: {
    score: number;
    confidence: number;
  };
  updatedAt: string;
};

function mapBreadth(value: "broad" | "selective" | "low"): NarrativeBreadth {
  if (value === "broad") return "broad";
  if (value === "selective") return "selective";
  return "weak";
}

function mapConfidence(value: "strong" | "moderate" | "low"): NarrativeConfidence {
  if (value === "strong") return "strong";
  if (value === "moderate") return "moderate";
  return "low";
}

function compactAssets(list: string[], max = 3): string[] {
  return [...new Set((list || []).filter(Boolean))].slice(0, max);
}

function assetsText(list: string[]): string {
  if (!list.length) return "core assets";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list[0]}, ${list[1]} and ${list[2]}`;
}

function buildHeadline(args: {
  state: NarrativeState;
  breadth: NarrativeBreadth;
  confidence: NarrativeConfidence;
  leadership: NarrativeLeadership;
}): string {
  const { state, breadth, confidence, leadership } = args;

  if (state === "bullish") {
    if (breadth === "broad") return "Upside pressure is building with broad participation.";
    if (breadth === "selective") return "Attention is rotating higher with selective participation.";
    return "Bullish pressure is emerging, but breadth remains limited.";
  }

  if (state === "bearish") {
    if (breadth === "broad") return "Risk-off pressure is spreading across the market.";
    if (breadth === "selective") return "Defensive rotation is building with selective participation.";
    return "Bearish pressure is visible, though participation remains narrow.";
  }

  if (state === "mixed") {
    if (leadership === "concentrated") {
      return "Market attention is mixed and leadership remains concentrated.";
    }
    if (confidence === "strong") {
      return "Market attention is mixed, but conviction remains elevated.";
    }
    return "Market attention is mixed and direction remains unresolved.";
  }

  if (breadth === "weak") {
    return "Attention remains balanced and conviction is still limited.";
  }

  return "Market attention remains neutral with no clear directional dominance.";
}

function buildSubline(args: {
  state: NarrativeState;
  breadth: NarrativeBreadth;
  confidence: NarrativeConfidence;
  focusAssets: string[];
  trends: LiveNarrativeInput["trends"];
}): string {
  const { state, breadth, confidence, focusAssets, trends } = args;
  const assets = assetsText(focusAssets);

  if (state === "bullish") {
    if (breadth === "broad") {
      return `${assets} are leading the tape while broader participation continues to improve.`;
    }
    return `${assets} are drawing the most attention, though confirmation remains ${confidence}.`;
  }

  if (state === "bearish") {
    return `${assets} sit at the center of market attention while downside pressure remains ${confidence}.`;
  }

  if (state === "mixed") {
    return `${assets} are active, but the broader tape still shows uneven participation and mixed follow-through.`;
  }

  if (trends.up > trends.down) {
    return `${assets} are active, though broader confirmation is still limited.`;
  }

  if (trends.down > trends.up) {
    return `${assets} remain in focus, but participation still lacks a strong upside impulse.`;
  }

  return `${assets} remain the main focus while market participation stays balanced.`;
}

function buildThemes(args: {
  state: NarrativeState;
  breadth: NarrativeBreadth;
  confidence: NarrativeConfidence;
  leadership: NarrativeLeadership;
  focusAssets: string[];
  trends: LiveNarrativeInput["trends"];
}): string[] {
  const { state, breadth, confidence, leadership, focusAssets, trends } = args;
  const out: string[] = [];

  const majorsLed = focusAssets.some((x) => x === "BTC" || x === "ETH");

  if (majorsLed) out.push("majors-led");
  if (state === "bullish") out.push("bullish pressure");
  if (state === "bearish") out.push("defensive tone");
  if (state === "mixed") out.push("mixed participation");
  if (state === "neutral") out.push("balanced attention");

  if (breadth === "broad") out.push("broad participation");
  if (breadth === "selective") out.push("selective breadth");
  if (breadth === "weak") out.push("weak breadth");

  if (confidence === "strong") out.push("strong conviction");
  if (confidence === "moderate") out.push("moderate conviction");
  if (confidence === "low") out.push("low conviction");

  if (leadership === "concentrated") out.push("concentrated leadership");
  if (leadership === "distributed") out.push("distributed leadership");

  if (trends.up >= 3 && trends.up > trends.down) out.push("trend expansion");
  if (trends.down >= 3 && trends.down > trends.up) out.push("risk-off spread");

  return [...new Set(out)].slice(0, 4);
}

function buildNote(args: {
  state: NarrativeState;
  breadth: NarrativeBreadth;
  confidence: NarrativeConfidence;
  leadership: NarrativeLeadership;
  trends: LiveNarrativeInput["trends"];
  mood?: LiveNarrativeInput["mood"];
}): string | undefined {
  const { state, breadth, confidence, leadership, trends, mood } = args;

  if (leadership === "concentrated" && breadth !== "broad") {
    return "Leadership is concentrated; follow-through across the board is still limited.";
  }

  if (confidence === "low" && mood && mood.confidence < 0.45) {
    return "Signal alignment remains weak; expect chop until conviction improves.";
  }

  if (state === "mixed" && trends.up > 0 && trends.down > 0) {
    return "Both upside and downside movers are active, which suggests unstable short-term direction.";
  }

  if (breadth === "weak" && state === "bullish") {
    return "Upside pressure is visible, but participation remains too narrow for strong confirmation.";
  }

  if (breadth === "weak" && state === "bearish") {
    return "Downside pressure is visible, though participation is still too narrow for broad confirmation.";
  }

  return undefined;
}

export function buildLiveNarrative(input: LiveNarrativeInput): LiveNarrative {
  const state: NarrativeState = input.socialPulse.state;
  const breadth = mapBreadth(input.socialPulse.breadth);
  const confidence = mapConfidence(input.socialPulse.conviction);
  const leadership: NarrativeLeadership = input.socialPulse.leadership;

  const focusAssets = compactAssets([
    ...input.socialPulse.topAssets,
    ...input.trends.topSymbols,
  ]);

  const headline = buildHeadline({
    state,
    breadth,
    confidence,
    leadership,
  });

  const subline = buildSubline({
    state,
    breadth,
    confidence,
    focusAssets,
    trends: input.trends,
  });

  const themes = buildThemes({
    state,
    breadth,
    confidence,
    leadership,
    focusAssets,
    trends: input.trends,
  });

  const note = buildNote({
    state,
    breadth,
    confidence,
    leadership,
    trends: input.trends,
    mood: input.mood,
  });

  return {
    headline,
    subline,
    themes,
    focusAssets,
    note,
    state,
    confidence,
    breadth,
    leadership,
    sourceType: "derived",
    updatedAt: input.updatedAt,
  };
}