"use client";

import type { Health } from "@/lib/health";

export default function PageHeader({
  title,
  subtitle,
  health,
  badge = "LIVE",
}: {
  title: string;
  subtitle?: string;
  health?: Health;
  badge?: "LIVE" | "DERIVED" | "BETA" | "—";
}) {
  const tone =
    health?.ok === true
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : health?.ok === false
      ? "border-rose-400/25 bg-rose-400/10 text-rose-200"
      : "border-white/10 bg-white/[0.04] text-white/72";

  const label = health?.ok === false ? "DEGRADED" : badge;

  return (
    <div className="mb-6">
      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-4 py-4 shadow-[0_14px_36px_rgba(0,0,0,0.14)] sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {title}
              </h1>

              <span
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold tracking-[0.18em] shadow-[0_0_0_1px_rgba(255,255,255,0.015)]",
                  tone,
                ].join(" ")}
              >
                {label}
              </span>
            </div>

            {subtitle ? (
              <div className="mt-2 max-w-[860px] text-sm leading-6 text-white/58 sm:text-[15px]">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 h-px w-full bg-gradient-to-r from-amber-300/18 via-white/6 to-transparent" />
      </div>
    </div>
  );
}