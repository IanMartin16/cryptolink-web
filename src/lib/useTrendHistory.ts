const trendHistory: Record<string, number[]> = {};

export function pushTrendHistory(symbol: string, score: number, max = 120) {
  const key = symbol.toUpperCase();
  const arr = trendHistory[key] ?? (trendHistory[key] = []);
  arr.push(score);
  if (arr.length > max) arr.splice(0, arr.length - max);
}

export function getTrendHistory(symbol: string): number[] {
  return trendHistory[symbol.toUpperCase()] ?? [];
}