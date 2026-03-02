"use client";

import { useEffect, useMemo, useState } from "react";
import PriceChartPanel from "@/components/PricesChartPanel";
import type { Health } from "@/lib/health";
import type { PriceRow } from "@/lib/types";
import { getSymbols, setSymbols } from "@/lib/symbolsStore";
import PricesPanel from "@/components/PricesPanel";
import StatusBar from "@/components/StatusBar";
import PageHeader from "@/components/PageHeader";


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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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