"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import FiatToggle from "@/components/FiatToggle";
import SymbolChips from "@/components/SymbolChips";
import ApiKeyBar from "@/components/ApiKeyBar";

import { getSymbols, setSymbols } from "@/lib/symbolsStore";
import { SYMBOL_META } from "@/lib/symbolMeta";

export default function SettingsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [showDev, setShowDev] = useState(false);

  const available = useMemo(() => Object.keys(SYMBOL_META), []);

  useEffect(() => {
    setSelected(getSymbols());

    const onSymbols = () => setSelected(getSymbols());
    window.addEventListener("cryptolink:symbols" as any, onSymbols);
    return () => window.removeEventListener("cryptolink:symbols" as any, onSymbols);
  }, []);

  const toggleSymbol = (sym: string) => {
    const S = new Set(selected);
    if (S.has(sym)) S.delete(sym);
    else S.add(sym);

    const next = Array.from(S);
    setSelected(next);
    setSymbols(next);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="watchlist · fiat · dev tools"
        badge="BETA"
      />

      <div className="mt-2 text-[14px] text-white/45">
        These settings are stored locally on this device.
      </div>

      {/* Fiat */}
      <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
        <div className="grid gap-1">
          <div className="text-[11px] font-semibold tracking-[0.16em] text-amber-300/80">
            DEFAULT FIAT
          </div>
          <div className="text-sm text-white/52">
            Configure the quote currency used across market views.
          </div>
        </div>

        <div className="mt-3">
          <FiatToggle />
        </div>
      </section>

      {/* Symbols */}
      <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <div className="text-[11px] font-semibold tracking-[0.16em] text-amber-300/80">
              WATCHLIST SYMBOLS
            </div>
            <div className="text-sm text-white/52">
              Choose the assets that stay active across your default market workspace.
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/55">
            {selected.length}/{available.length || 50} selected
          </div>
        </div>

        <div className="mt-4 max-h-[320px] overflow-auto pr-1">
          <SymbolChips
            symbols={available}
            selected={selected}
            onToggle={toggleSymbol}
          />
        </div>
      </section>

      {/* Dev tools */}
      <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.14)]">
        <button
          onClick={() => setShowDev((v) => !v)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-[12px] font-semibold text-white/72 transition hover:bg-white/[0.05]"
        >
          Dev tools <span className="font-normal text-white/40">(API key)</span>
          <span className="float-right text-white/40">{showDev ? "−" : "+"}</span>
        </button>

        {showDev ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <ApiKeyBar />
          </div>
        ) : null}
      </section>
    </div>
  );
}