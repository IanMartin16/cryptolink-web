"use client";

import { UI } from "@/lib/ui";

type Insight = {
  line1: string;
  line2: string;
  divergence: boolean;
};

type Props = {
  score: number; // -100..100
  updatedAt?: string; // string ya resuelta desde el padre (client)
  confidence?: number;
  insight?: Insight;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function moodLabel(score: number) {
  if (score >= 60) return "STRONG BULLISH";
  if (score >= 25) return "BULLISH";
  if (score > -25) return "NEUTRAL";
  if (score > -60) return "BEARISH";
  return "STRONG BEARISH";
}

function moodTone(score: number, UI: any) {
  if (score > 20) return UI.green;
  if (score < -20) return UI.red;
  return "rgba(255,255,255,0.75)";
}

function toneColor(tone: "up" | "down" | "flat") {
  return tone === "up" ? UI.green : tone === "down" ? UI.red : UI.orangeSoft;
}
    

export default function MarketMood({ score, updatedAt, confidence, insight }: Props ) {
  const s = clamp(score, -100, 100);
  const label = moodLabel(s);
  const tone = moodTone(s, UI);
  const color = toneColor(tone);

  // -100..100  ->  0..100
  const pct = Math.max(0, Math.min(100, (score + 100) /2));

  const glow =
    tone === "up"
      ? "rgba(46,229,157,0.18)"
      : tone === "down"
      ? "rgba(255,107,107,0.18)"
      : "rgba(255,159,67,0.18)";

  function Gauge({ value, UI }: { value: number; UI: any }) {
  const v = Math.max(0, Math.min(1, value));
  const r = 14;
  const c = 2 * Math.PI * r;
  const dash = c * v;

  return (
    <svg width="36" height="36" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} stroke="rgba(255,255,255,0.10)" strokeWidth="4" fill="none" />
      <circle
        cx="20"
        cy="20"
        r={r}
        stroke={UI.orangeSoft}
        strokeWidth="4"
        fill="none"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}    

  return (
  <div
    className="rounded-[18px] border border-white/10 bg-white/[0.02] p-4 sm:p-[18px] shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
    style={{
      boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 28px ${glow}`,
      marginBottom: 14,
      background:
        "linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
    }}
  >
    {/* ✅ HEADER responsive: columna en mobile, fila en sm+ */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="text-[12px] font-black tracking-[0.35px] text-white/65">
          MARKET SENTIMENT
        </div>

        {/* ✅ label: wrap en mobile, ellipsis en sm+ */}
        <div
          className="mt-1 text-[22px] font-black tracking-[0.5px] sm:mt-1.5 sm:text-[28px] sm:whitespace-nowrap sm:overflow-hidden sm:text-ellipsis"
          style={{
            color,
            textShadow: "0 0 14px rgba(0,0,0,0.35)",
          }}
          title={label}
        >
          {label}
        </div>

        {/* ✅ chips: se acomodan sin empujar */}
        <div className="mt-2 flex flex-wrap gap-2">
          {/* si no usas este chip, quítalo (ahorita está vacío y solo estorba) */}
          {/* <span ...>...</span> */}

          <span
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[12px] font-black text-white/90"
            style={{ whiteSpace: "nowrap" }}
          >
            Updated: <span style={{ color: UI.orangeSoft }}>{updatedAt ?? "—"}</span>
          </span>

          {/* ✅ Confidence como chip (mucho más compacto en mobile) */}
          {typeof confidence === "number" ? (
            <span
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[12px] font-black text-white/90"
              style={{ whiteSpace: "nowrap" }}
            >
              Confidence: <span style={{ color: UI.orangeSoft }}>{(confidence * 100).toFixed(0)}%</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* ✅ SCORE: ya no fuerza minWidth en mobile */}
      <div className="text-left sm:text-right sm:min-w-[120px]">
        <div className="text-[12px] font-black text-white/65">Score</div>
        <div className="mt-1 text-[24px] font-black sm:mt-1.5 sm:text-[28px]" style={{ color }}>
          {s.toFixed(0)}
        </div>
      </div>
    </div>

    {/* Gauge */}
    <div className="mt-3 sm:mt-[14px]">
      <div
        className="h-[10px] overflow-hidden rounded-full border border-white/10 bg-white/[0.04]"
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.10))`,
            boxShadow: `0 0 16px ${glow}`,
            transition: "width 260ms ease",
          }}
        />
      </div>

      {insight ? (
        <div className="mt-3 grid gap-1.5">
          <div className="text-[12px] leading-[1.35] text-white/85">{insight.line1}</div>
          <div
            className="text-[12px] leading-[1.35]"
            style={{ color: insight.divergence ? UI.red : "rgba(255,255,255,0.82)" }}
          >
            {insight.line2}
          </div>
        </div>
      ) : null}

      <div className="mt-2 flex justify-between text-[11px] text-white/60">
        <span>Bearish</span>
        <span>Neutral</span>
        <span>Bullish</span>
      </div>
    </div>
  </div>
);
}