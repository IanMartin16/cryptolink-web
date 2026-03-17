"use client";

import { useMemo, useEffect, useState } from "react";
import Sparkline from "@/components/Sparkline";
import { usePriceHistory, getPriceHistory } from "@/lib/usePriceHistory";
import { formatMoney } from "@/lib/format";

export default function HeroPriceCard({
  symbol,
  fiat,
  price,
  cache,
}: {
  symbol: string;
  fiat: string;
  price?: number;
  cache?: string;
}) {
  const priceNode = useMemo(() => {
    if (typeof price !== "number") return "—";
    return formatMoney(price, fiat);
  }, [price, fiat]);

  usePriceHistory(symbol, price, 600);
  const hist = getPriceHistory(symbol).slice(-30);
  const firstVisible = hist.length >= 2 ? hist[0] : undefined;
  const lastVisible = hist.length >= 2 ? hist[hist.length - 1] : undefined;

  const netMove =
    typeof firstVisible === "number" && typeof lastVisible === "number"
      ? lastVisible - firstVisible
      : 0;

  const sparkStroke =
    netMove > 0
      ? "rgba(46,229,157,0.82)"
      : netMove < 0
      ? "rgba(255,107,107,0.82)"
      : "rgba(255,159,67,0.80)";

  const sparkFill =
    netMove > 0
      ? "rgba(46,229,157,0.08)"
      : netMove < 0
      ? "rgba(255,107,107,0.08)"
      : "rgba(255,159,67,0.08)";

  const statusLabel = cache === "HIT" ? "CACHED" : "LIVE";

  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (typeof price !== "number") return;

    const key = `__last_${symbol}_${fiat}`;
    const last = (window as any)[key] as number | undefined;
    (window as any)[key] = price;

    if (typeof last === "number") {
      if (price > last) setFlash("up");
      else if (price < last) setFlash("down");
      else setFlash(null);

      setPulse(true);

      const tPulse = setTimeout(() => setPulse(false), 260);
      const tFlash = setTimeout(() => setFlash(null), 420);

      return () => {
        clearTimeout(tPulse);
        clearTimeout(tFlash);
      };
    }
  }, [price, fiat, symbol]);

  const outline =
    flash === "up"
      ? "1px solid rgba(46,229,157,0.42)"
      : flash === "down"
      ? "1px solid rgba(255,107,107,0.42)"
      : "1px solid rgba(255,255,255,0.10)";

  const glow =
    flash === "up"
      ? "rgba(46,229,157,0.16)"
      : flash === "down"
      ? "rgba(255,107,107,0.16)"
      : "rgba(255,159,67,0.10)";

  const badgeStyle =
    statusLabel === "CACHED"
      ? {
          border: "1px solid rgba(46,229,157,0.18)",
          background: "rgba(46,229,157,0.08)",
          color: "rgba(220,255,236,0.92)",
        }
      : {
          border: "1px solid rgba(255,159,67,0.18)",
          background: "rgba(255,159,67,0.08)",
          color: "rgba(255,232,204,0.92)",
        };

  return (
    <section
      style={{
        padding: 20,
        borderRadius: 20,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
        outline,
        boxShadow: flash
          ? `0 0 0 1px rgba(255,255,255,0.03), 0 0 18px ${glow}`
          : "0 0 0 1px rgba(255,255,255,0.03), 0 12px 34px rgba(0,0,0,0.24)",
        transform: pulse ? "scale(1.008)" : "scale(1)",
        transition: "transform 180ms ease, box-shadow 180ms ease, outline 180ms ease",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
        style={{ minWidth: 0 }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
            <span
              style={{
                padding: "5px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                fontWeight: 900,
                letterSpacing: 0.2,
                whiteSpace: "nowrap",
              }}
            >
              {symbol}
            </span>

            <span
              className="text-[12px] text-white/55"
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Core market asset
            </span>
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: "clamp(24px, 6vw, 40px)",
              fontWeight: 950,
              color: "#ffb86b",
              textShadow: "0 0 12px rgba(255,159,67,0.16)",
              letterSpacing: 0.2,
              lineHeight: 1.02,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              minWidth: 0,
            }}
          >
              {priceNode}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "rgba(255,255,255,0.56)",
              whiteSpace: "nowrap",
            }}
          >
            {fiat}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span
            style={{
              ...badgeStyle,
              padding: "5px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.46)",
          }}
        >
          Live price pulse
        </div>

        <div style={{ opacity: 0.96, flexShrink: 0 }}>
          <Sparkline
            values={hist}
            w={132}
            h={30}
            stroke={sparkStroke}
            fill={sparkFill}
          />
        </div>
      </div>
    </section>
  );
}