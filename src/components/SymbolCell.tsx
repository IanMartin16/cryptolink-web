"use client";

import { getCryptoIconUrl, getSymbolName } from "@/lib/symbolMeta";

function initials(sym: string) {
  return (sym || "—").slice(0, 3).toUpperCase();
}

export default function SymbolCell({
  symbol,
  fiat,
  showName = false,   // default false = comportamiento ACTUAL intacto (Momentum, etc.)
}: {
  symbol: string;
  fiat?: string;
  showName?: boolean;
}) {
  const iconUrl = getCryptoIconUrl(symbol);
  const name = showName ? getSymbolName(symbol) : undefined;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl}
          alt={symbol}
          className="h-5 w-5 rounded-full shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/70">
          {initials(symbol)}
        </div>
      )}

      {showName && name ? (
        // MODO showName: UNA sola línea — nombre + ticker lado a lado (convención
        // CoinGecko/CMC: "Bitcoin BTC"). El nombre trunca en pantallas compactas
        // (iPhone 11 Pro), el ticker se mantiene (shrink-0) porque es corto.
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="truncate text-sm font-semibold text-white/90" title={name}>
            {name}
          </span>
          <span className="shrink-0 text-[11px] font-medium text-white/45">
            {symbol}
          </span>
        </div>
      ) : (
        // MODO actual (default): ticker + fiat apilado. Intacto para Momentum y demás.
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-white/90">{symbol}</div>
          {fiat ? <div className="text-[11px] text-white/45">{fiat}</div> : null}
        </div>
      )}
    </div>
  );
}
