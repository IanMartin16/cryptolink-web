"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type TrendItem = {
  symbol: string;
  trend: "up" | "down" | "flat";
  score: number;
  reason: string;
};

type TrendsResponse = {
  ts: string;
  data: TrendItem[];
};

type MomentumItem = {
  symbol: string;
  direction: "up" | "down" | "flat";
  changePct: number;
  strength: "low" | "medium" | "high";
  score: number;
  last: number | null;
  source: string;
};

type MomentumResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  momentum: MomentumItem[];
};

type RegimeResponse = {
  ok: boolean;
  fiat: string;
  ts: string;
  source: string;
  regime: {
    state: "bullish" | "bearish" | "neutral" | "mixed";
    score: number;
    confidence: number;
    summary: string;
  };
};

type SignalPoint = {
  label: string;
  value: number;
};

type SignalsResponse = {
  ok: boolean;
  ts: string;
  fiat: string;
  signals: SignalPoint[];
};

type MarketSignalsState = {
  trends: TrendsResponse | null;
  momentum: MomentumResponse | null;
  regime: RegimeResponse | null;
  signals: SignalsResponse | null;

  trendsUpdatedAt: number | null;
  momentumUpdatedAt: number | null;
  regimeUpdatedAt: number | null;
  signalsUpdatedAt: number | null;

  setTrends: (v: TrendsResponse) => void;
  setMomentum: (v: MomentumResponse) => void;
  setRegime: (v: RegimeResponse) => void;
  setSignals: (v: SignalsResponse) => void;

  clearAll: () => void;
};

export const useMarketSignalsStore = create<MarketSignalsState>()(
  persist(
    (set) => ({
      trends: null,
      momentum: null,
      regime: null,
      signals: null,

      trendsUpdatedAt: null,
      momentumUpdatedAt: null,
      regimeUpdatedAt: null,
      signalsUpdatedAt: null,

      setTrends: (v) =>
        set({
          trends: v,
          trendsUpdatedAt: Date.now(),
        }),

      setMomentum: (v) =>
        set({
          momentum: v,
          momentumUpdatedAt: Date.now(),
        }),

      setRegime: (v) =>
        set({
          regime: v,
          regimeUpdatedAt: Date.now(),
        }),

      setSignals: (v) =>
        set({
          signals: v,
          signalsUpdatedAt: Date.now(),
        }),

      clearAll: () =>
        set({
          trends: null,
          momentum: null,
          regime: null,
          signals: null,
          trendsUpdatedAt: null,
          momentumUpdatedAt: null,
          regimeUpdatedAt: null,
          signalsUpdatedAt: null,
        }),
    }),
    {
      name: "cryptolink-market-signals",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        trends: state.trends,
        momentum: state.momentum,
        regime: state.regime,
        signals: state.signals,
        trendsUpdatedAt: state.trendsUpdatedAt,
        momentumUpdatedAt: state.momentumUpdatedAt,
        regimeUpdatedAt: state.regimeUpdatedAt,
        signalsUpdatedAt: state.signalsUpdatedAt,
      }),
    }
  )
);