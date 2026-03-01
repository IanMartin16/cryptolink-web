"use client";

import { useEffect, useMemo, useState } from "react";
import SymbolChips from "@/components/SymbolChips";
import PriceChartPanel from "@/components/PricesChartPanel";
import type { Health } from "@/lib/health";
import type { PriceRow } from "@/lib/types";
import { getSymbols, setSymbols } from "@/lib/symbolsStore";
import PricesPanel from "@/components/PricesPanel";
import StatusBar from "@/components/StatusBar";
import PageHeader from "@/components/PageHeader";
import FiatToggle from "@/components/FiatToggle";
import ApiKeyBar from "@/components/ApiKeyBar";
 


const AVAILABLE = [
  "BTC","ETH","SOL","XRP","ADA","DOGE","BNB","AVAX","LINK","MATIC",
  "DOT","LTC","BCH","UNI","ATOM","NEAR","ARB","OP","USDT","SUI",
  "USDC", "SHIB", "DAI", "XLM", "FTM", "VET", "TRX"
];


export default function SymbolsPage() {
  const [selected, setSelectedState] = useState<string[]>([]);
  const [main, setMain] = useState("BTC");

  // feed para el chart (reusamos tu PricesPanel para no duplicar fetch todavía)
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [health, setHealth] = useState<Health | undefined>(undefined);

  useEffect(() => {
    const s = getSymbols();
    setSelectedState(s);
    if (s[0]) setMain(s[0]);
  }, []);

  // si main ya no está seleccionado, cae al primero
  useEffect(() => {
    if (!selected.length) return;
    if (!selected.includes(main)) setMain(selected[0]);
  }, [selected, main]);

  const available = useMemo(() => AVAILABLE, []);

  const toggle = (sym: string) => {
    setSelectedState((prev) => {
      const key = sym.toUpperCase();
      const has = prev.includes(key);
      const next = has ? prev.filter((x) => x !== key) : [...prev, key];
      const capped = next.slice(0, 20);

      // ✅ persistimos en TU store
      setSymbols(capped);

      // asegura main razonable
      if (!capped.includes(main) && capped[0]) setMain(capped[0]);

      return capped;
    });
  };

  const [showDev, setShowDev] = useState(false);

useEffect(() => {
  // ✅ solo abre dev tools si hay flag en URL o localStorage
  const qs = new URLSearchParams(window.location.search);
  const flag = qs.get("dev") === "1" || localStorage.getItem("cryptolink:dev") === "1";
  setShowDev(flag);
}, []);

  return (
  <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6 space-y-4">
    <PageHeader
      title="Symbols"
      subtitle="watchlist · Chart overlays · Real-time view"
      badge="BETA"
    />

    <StatusBar prices={health} />

    {/* TOP GRID */}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* LEFT */}
      <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-3 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold tracking-wide text-white/70">
            SYMBOLS
          </div>
          <div className="text-[11px] text-white/45">
            {selected.length}/27 selected
          </div>
        </div>

        <div className="mt-3 max-h-[260px] overflow-auto pr-1">
          <SymbolChips symbols={available} selected={selected} onToggle={toggle} />
        </div>

        <div className="mt-3">
          <FiatToggle />
        </div>

        {/* Dev tools toggle */}
        <div className="mt-3">
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

      {/* RIGHT */}
      <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-2 lg:col-span-2">
        {/* 👇 asegura que el chart tenga espacio en iPhone */}
        <div className="min-h-[320px] sm:min-h-[360px]">
          <PriceChartPanel rows={rows} symbol={main} onSymbolChange={setMain} />
        </div>
      </div>
    </div>

    {/* FEED */}
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
      <PricesPanel onRows={setRows} onHealth={setHealth} />
    </div>
  </div>
);
}