"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import FiatToggle from "@/components/FiatToggle";
import SymbolChips from "@/components/SymbolChips";
import ApiKeyBar from "@/components/ApiKeyBar";

import { getSymbols, setSymbols } from "@/lib/symbolsStore";
// Si ya tienes un source “oficial” de los 27 símbolos, úsalo aquí:
import { SYMBOL_META  } from "@/lib/symbolMeta"; // <-- si no existe, te digo abajo cómo


export default function SettingsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [showDev, setShowDev] = useState(false);

  

  // ✅ lista disponible (ideal: tus 27 símbolos)
  const available = useMemo(() => Object.keys(SYMBOL_META), []);

  useEffect(() => {
    setSelected(getSymbols());

    // si en otro lado cambian symbols, nos sincronizamos
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

    // ✅ esto persiste y además dispara el evento (tu store ya lo hace)
    setSymbols(next);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="watchlist · fiat · dev tools" badge="BETA" />
      <div className="mt-2 text-[14px] text-white/45">
        These settings are stored locally (this device).
      </div>

      {/* Fiat */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="text-xs font-semibold tracking-wide text-white/70">DEFAULT FIAT</div>
        <div className="mt-2">
          <FiatToggle />
        </div>
      </div>

      {/* Symbols */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold tracking-wide text-white/70">WATCHLIST SYMBOLS</div>
          <div className="text-[11px] text-white/45">
            {selected.length}/{available.length || 27} selected
          </div>
        </div>

        <div className="mt-3 max-h-[320px] overflow-auto pr-1">
          <SymbolChips symbols={available} selected={selected} onToggle={toggleSymbol} />
        </div>
      </div>

      {/* Dev tools (API key) */}
      <div>
        <button
          onClick={() => setShowDev((v) => !v)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-[12px] font-semibold text-white/70 hover:bg-white/[0.04]"
        >
          Dev tools <span className="text-white/40 font-normal">(API key)</span>
          <span className="float-right text-white/40">{showDev ? "−" : "+"}</span>
        </button>

        {showDev ? (
          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
            <ApiKeyBar />
          </div>
        ) : null}
      </div>
    </div>
  );
}