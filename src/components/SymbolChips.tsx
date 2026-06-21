"use client";

import { useMemo } from "react";

export default function SymbolChips({
  symbols,
  selected,
  onToggle,
}: {
  symbols: string[];
  selected: string[];
  onToggle: (sym: string) => void;
}) {
  const sel = useMemo(() => new Set(selected.map((x) => x.toUpperCase())), [selected]);

  return (
    <div className="flex flex-wrap gap-2.5">
      {symbols.map((s) => {
        const key = s.toUpperCase();
        const active = sel.has(key);

        return (
          <button
            key={s}
            onClick={() => onToggle(s)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-[0.01em] transition-all duration-200",
              "backdrop-blur-sm",
              active
                ? "border-amber-300/25 bg-gradient-to-b from-amber-300/15 to-amber-200/5 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.06),0_10px_24px_rgba(0,0,0,0.18)]"
                : "border-white/10 bg-white/[0.04] text-white/70 hover:border-amber-200/18 hover:bg-amber-200/[0.06] hover:text-white",
            ].join(" ")}
            aria-pressed={active}
            title={active ? "Selected" : "Select"}
          >
            <span className="inline-flex items-center gap-1.5">
              {active ? (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.65)]" />
              ) : null}
              {s}
            </span>
          </button>
        );
      })}
    </div>
  );
}
