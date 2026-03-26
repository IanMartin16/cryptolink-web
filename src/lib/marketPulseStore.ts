export type MarketPulsePrefs = {
  max: number;
  compact: boolean;
};

const KEY = "cryptolink:marketPulse:prefs";

const DEFAULT_PREFS: MarketPulsePrefs = {
  max: 12,
  compact: true,
};

export function getMarketPulsePrefs(): MarketPulsePrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;

    const parsed = JSON.parse(raw) as Partial<MarketPulsePrefs>;
    return {
      max:
        typeof parsed.max === "number" && parsed.max > 0
          ? parsed.max
          : DEFAULT_PREFS.max,
      compact:
        typeof parsed.compact === "boolean"
          ? parsed.compact
          : DEFAULT_PREFS.compact,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function setMarketPulsePrefs(next: MarketPulsePrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
}