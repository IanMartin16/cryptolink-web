import type { SnapshotKPIs, PriceRow } from "@/lib/types";

type TrendItem = {
  symbol: string;
  trend: "up" | "down" | "flat";
  score: number;
  reason?: string;
};

type Mood = {
  score: number;
  confidence: number;
};

export type InsightV2 = {
  headline: string;
  summary: string;
  note?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pick(snapshot: SnapshotKPIs, key: string) {
  return snapshot.items.find((x) => x.key === key);
}

function moodLabel(score: number) {
  if (score >= 60) return "Strong Bullish";
  if (score >= 25) return "Bullish";
  if (score > -25) return "Neutral";
  if (score > -60) return "Bearish";
  return "Strong Bearish";
}

function toneWord(tone?: string) {
  switch (tone) {
    case "good":
      return "constructive";
    case "warn":
      return "mixed";
    case "bad":
      return "risk-off";
    default:
      return "neutral";
  }
}

function pressureRegime(p: number) {
  const a = Math.abs(p);
  if (a < 10) return "balanced";
  if (a < 30) return "tilted";
  return "strong";
}

function topTrends(trends: TrendItem[], n = 2) {
  return [...(trends || [])]
    .filter((t) => typeof t.score === "number")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, n)
    .map((t) => t.symbol ?? "—");
}

export function buildInsightV2(input: {
  mood: Mood;
  snapshot: SnapshotKPIs;
  rows: PriceRow[];
  trends: TrendItem[];
}): InsightV2 {
  const moodScore = clamp(
    Number.isFinite(input.mood.score) ? input.mood.score : 0,
    -100,
    100
  );
  const confidence = clamp(
    Number.isFinite(input.mood.confidence) ? input.mood.confidence : 0,
    0,
    1
  );

  const kUpDown = pick(input.snapshot, "upDown");
  const kDiv = pick(input.snapshot, "divergence");
  const kConf = pick(input.snapshot, "confidence");
  const kPress = pick(input.snapshot, "pressure");

  const pressure =
    typeof kPress?.raw === "number" && Number.isFinite(kPress.raw)
      ? kPress.raw
      : moodScore;

  const regime = pressureRegime(pressure);
  const bias = moodLabel(moodScore);

  const div =
    typeof kDiv?.raw === "number" && Number.isFinite(kDiv.raw)
      ? kDiv.raw
      : 0;

  const divTone = toneWord(kDiv?.tone);
  const confPct = Math.round(confidence * 100);
  const confTone = toneWord(kConf?.tone);

  const themes = topTrends(input.trends, 2);
  const themeTxt = themes.length ? ` • themes: ${themes.join(", ")}` : "";

  const sign = pressure >= 0 ? "+" : "";
  const headline = `Market ${bias} • pressure ${sign}${Math.round(pressure)} (${regime})`;

  const upDown = kUpDown?.value ?? "-- / --";
  const divergence = kDiv?.value ?? "—";

  const summary =
    `Breadth ${upDown} • divergence ${divergence} (${divTone}) • confidence ${confPct}% (${confTone})${themeTxt}`;

  let note: string | undefined;

  if (div >= 45) {
    note = `Caution: signal/price alignment is ${div >= 70 ? "extremely" : "materially"} diverged — expect whipsaws.`;
  } else if (confidence < 0.45) {
    note = "Caution: low confidence — treat moves as noise until confirmation.";
  } else if (Math.abs(pressure) >= 30 && confidence >= 0.75) {
    note = "Bias is clean — momentum traders may lean with the pressure.";
  }

  return { headline, summary, note };
}