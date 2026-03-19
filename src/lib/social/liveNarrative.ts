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
  sourceType: "derived" | "hybrid" | "social_native";
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
  basicSignals?: BasicSignalsInput;
  updatedAt: string;
};

export type SocialAttentionItem = {
  asset: string;
  attentionScore: number;
  attentionDeltaPct: number;
  direction: "up" | "down" | "flat";
  tags?: string[];
};

export type BasicSignalsInput = {
  topAssets: string[];
  attentionLeaders: SocialAttentionItem[];
  attentionLosers: SocialAttentionItem[];
  tags: string[];
  coverage: "low" | "moderate" | "broad";
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

 function resolveFocusAssets(input: LiveNarrativeInput): string[] {
  const leaders = input.basicSignals?.attentionLeaders?.map((x) => x.asset) ?? [];
  const realTop = input.basicSignals?.topAssets ?? [];
  const derived = [
    ...input.socialPulse.topAssets,
    ...input.trends.topSymbols,
  ];

  return compactAssets([...leaders, ...realTop, ...derived], 3);
}

function resolveAttentionLeaders(input: LiveNarrativeInput): string[] {
  const leaders = input.basicSignals?.attentionLeaders?.map((x) => x.asset) ?? [];
  const realTop = input.basicSignals?.topAssets ?? [];
  const derived = input.socialPulse.topAssets ?? [];
  return compactAssets([...leaders, ...realTop, ...derived], 3);
}

function resolveThemes(input: LiveNarrativeInput, fallback: string[]): string[] {
  const realTags = input.basicSignals?.tags ?? [];
  if (realTags.length) {
    return [...new Set([...realTags, ...fallback])].slice(0, 3);
  }
  return fallback.slice(0, 3);
}

function assetsText(list: string[]): string {
  if (!list.length) return "core assets";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list[0]}, ${list[1]} and ${list[2]}`;
}

function topLeader(input: LiveNarrativeInput): SocialAttentionItem | undefined {
  return input.basicSignals?.attentionLeaders?.[0];
}

function topLoser(input: LiveNarrativeInput): SocialAttentionItem | undefined {
  return input.basicSignals?.attentionLosers?.[0];
}

function buildHeadline(args: {
  state: NarrativeState;
  breadth: NarrativeBreadth;
  confidence: NarrativeConfidence;
  leadership: NarrativeLeadership;
  basicSignals?: LiveNarrativeInput["basicSignals"];
}): string {
  const { state, breadth, confidence, leadership, basicSignals } = args;

  const leader = basicSignals?.attentionLeaders?.[0]?.asset;
  const hasRealSignals = Boolean(basicSignals);

  if (state === "bullish") {
    if (hasRealSignals && leader) {
      if (breadth === "broad") return `Real attention is expanding higher with ${leader} leading the flow.`;
      if (breadth === "selective") return `Real attention is rotating higher with ${leader} at the center.`;
      return `Bullish attention is building around ${leader}, but breadth remains limited.`;
    }

    if (breadth === "broad") return "Upside pressure is building with broad participation.";
    if (breadth === "selective") return "Attention is rotating higher with selective participation.";
    return "Bullish pressure is emerging, but breadth remains limited.";
  }

  if (state === "bearish") {
    if (hasRealSignals && leader) {
      if (breadth === "broad") return `Real attention is turning defensive with ${leader} still dominating the tape.`;
      if (breadth === "selective") return `Risk-off attention is building with ${leader} in focus.`;
      return `Bearish pressure is visible around ${leader}, though participation remains narrow.`;
    }

    if (breadth === "broad") return "Risk-off pressure is spreading across the market.";
    if (breadth === "selective") return "Defensive rotation is building with selective participation.";
    return "Bearish pressure is visible, though participation remains narrow.";
  }

  if (state === "mixed") {
    if (hasRealSignals) {
      if (leadership === "concentrated") {
        return "Real attention is mixed and leadership remains uneven.";
      }
      return "Real attention is mixed and directional control is still unresolved.";
    }

    if (leadership === "concentrated") {
      return "Market attention is mixed and leadership remains concentrated.";
    }
    if (confidence === "strong") {
      return "Market attention is mixed, but conviction remains elevated.";
    }
    return "Market attention is mixed and direction remains unresolved.";
  }

  if (hasRealSignals && basicSignals?.coverage === "low") {
    return "Real attention remains limited and directional control is still unclear.";
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
  leaders: string[];
  trends: LiveNarrativeInput["trends"];
  hasRealSignals: boolean;
  basicSignals?: LiveNarrativeInput["basicSignals"];
}): string {
  const { state, breadth, confidence, leaders, trends, hasRealSignals, basicSignals } = args;
  const assets = assetsText(leaders);

  const loserA = basicSignals?.attentionLosers?.[0]?.asset;
  const loserB = basicSignals?.attentionLosers?.[1]?.asset;

  if (state === "bullish") {
    if (breadth === "broad") {
      return hasRealSignals
        ? `${assets} are leading real attention flows while broader participation continues to improve.`
        : `${assets} are leading the tape while broader participation continues to improve.`;
    }

    if (loserA) {
      return hasRealSignals
        ? `${assets} are drawing the strongest real attention while ${loserA} starts to fade from focus.`
        : `${assets} are drawing the most attention, though confirmation remains ${confidence}.`;
    }

    return hasRealSignals
      ? `${assets} are drawing the strongest real attention, though confirmation remains ${confidence}.`
      : `${assets} are drawing the most attention, though confirmation remains ${confidence}.`;
  }

  if (state === "bearish") {
    if (loserA && loserB) {
      return `${assets} remain central to attention while ${loserA} and ${loserB} continue losing momentum.`;
    }
    return `${assets} sit at the center of market attention while downside pressure remains ${confidence}.`;
  }

  if (state === "mixed") {
  if (loserA) {
    return `${assets} remain central to attention, though leadership is uneven as ${loserA} fades from focus.`;
  }
  return `${assets} remain active, but broader participation still looks uneven and lacks clean follow-through.`;
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
  basicSignals?: LiveNarrativeInput["basicSignals"];
}): string | undefined {
  const { state, breadth, confidence, leadership, trends, mood, basicSignals } = args;

  if (basicSignals?.coverage === "low") {
    return "Real attention coverage remains limited; treat the narrative as an early signal.";
  }

  const losers = basicSignals?.attentionLosers ?? [];
  if (losers.length >= 2 && leadership === "concentrated") {
    return `Leadership is narrow while ${losers[0].asset} and ${losers[1].asset} continue to fade from attention.`;
  }

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

  const focusAssets = resolveFocusAssets(input);
  const leaders = resolveAttentionLeaders(input);
  const hasRealSignals = !!input.basicSignals;


  const headline = buildHeadline({
    state,
    breadth,
    confidence,
    leadership,
    basicSignals: input.basicSignals,
  });

  const subline = buildSubline({
    state,
    breadth,
    confidence,
    leaders,
    trends: input.trends,
    hasRealSignals,
    basicSignals: input.basicSignals,
  });

  const fallbackThemes = buildThemes({
    state,
    breadth,
    confidence,
    leadership,
    focusAssets,
    trends: input.trends,
  });

  const themes = resolveThemes(input, fallbackThemes);

  const note = buildNote({
    state,
    breadth,
    confidence,
    leadership,
    trends: input.trends,
    mood: input.mood,
    basicSignals: input.basicSignals,
  });

  const sourceType: LiveNarrative["sourceType"] = input.basicSignals
    ? "hybrid"
    : "derived";

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
    sourceType,
    updatedAt: input.updatedAt,
  };
}
