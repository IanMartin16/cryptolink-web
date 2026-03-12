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

type Point = {
  time: number;
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
  marketHealth: any | null;
  trendPulseHistory: Point[]; 

  trendsUpdatedAt: number | null;
  momentumUpdatedAt: number | null;
  regimeUpdatedAt: number | null;
  signalsUpdatedAt: number | null;
  marketHealthUpdatedAt: number | null;
  trendPulseUpdatedAt: number | null;

  setTrends: (v: TrendsResponse) => void;
  setMomentum: (v: MomentumResponse) => void;
  setRegime: (v: RegimeResponse) => void;
  setSignals: (v: SignalsResponse) => void;
  setMarketHealth: (v: any) => void;
  setTrendPulseHistory: (points: Point[]) => void;
  appendTrendPulsePoint: (point: Point, maxPoints?: number) => void;

  clearAll: () => void;
};

export const useMarketSignalsStore = create<MarketSignalsState>()(
  persist(
    (set) => ({
      trends: null,
      momentum: null,
      regime: null,
      signals: null,
      marketHealth: null,
      trendPulseHistory: [],

      trendsUpdatedAt: null,
      momentumUpdatedAt: null,
      regimeUpdatedAt: null,
      signalsUpdatedAt: null,
      marketHealthUpdatedAt: null,
      trendPulseUpdatedAt: null,

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

        setMarketHealth: (v) =>
          set({
          marketHealth: v,
          marketHealthUpdatedAt: Date.now(),
        }),

        setTrendPulseHistory: (points) =>
          set({
          trendPulseHistory: points,
          trendPulseUpdatedAt: Date.now(),
        }),

        appendTrendPulsePoint: (point, maxPoints = 40) =>
          set((state) => {
            const next = [...state.trendPulseHistory, point];
            const trimmed =
              next.length > maxPoints ? next.slice(next.length - maxPoints) : next;

            return {
              trendPulseHistory: trimmed,
              trendPulseUpdatedAt: Date.now(),
            };
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
          marketHealth: null,
          marketHealthUpdatedAt: null,
          trendPulseHistory: [],
          trendPulseUpdatedAt: null,
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
        marketHealth: state.marketHealth,
        marketHealthUpdatedAt: state.marketHealthUpdatedAt,
      }),
    }
  )
);