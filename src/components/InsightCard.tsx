"use client";

function insightTone(score: number): "good" | "warn" | "bad" | "neutral" {
  if (score >= 25) return "good";
  if (score <= -25) return "bad";
  if (Math.abs(score) >= 10) return "warn";
  return "neutral";
}

function toneClasses(tone: "good" | "warn" | "bad" | "neutral") {
  switch (tone) {
    case "good":
      return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "warn":
      return "border border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "bad":
      return "border border-rose-500/30 bg-rose-500/10 text-rose-200";
    default:
      return "border border-white/10 bg-white/5 text-white/80";
  }
}

function toneLabel(tone: "good" | "warn" | "bad" | "neutral") {
  switch (tone) {
    case "good":
      return "Constructive";
    case "warn":
      return "Mixed";
    case "bad":
      return "Risk-off";
    default:
      return "Neutral";
  }
}

export default function InsightCard({
  headline,
  summary,
  note,
  moodScore,
}: {
  headline: string;
  summary: string;
  note?: string;
  moodScore: number;
}) {
  const tone = insightTone(moodScore);

  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold tracking-wide ${toneClasses(
            tone
          )}`}
          title={`mood score: ${Math.round(moodScore)}`}
        >
          {toneLabel(tone)}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white/90">
            {headline}
          </div>
          <div className="mt-0.5 text-xs text-white/70">{summary}</div>
          {note ? (
            <div className="mt-1 text-xs text-white/50">{note}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}