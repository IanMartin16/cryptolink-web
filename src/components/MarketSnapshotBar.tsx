"use client";

import { useEffect, useMemo, useState } from "react";
import DataStatusBadge from "@/components/DataStatusBadge";
import type { SnapshotKPIs, SnapshotKPI } from "@/lib/types";

type Props = {
  snapshot: SnapshotKPIs;
  status?: "live" | "restored" | "refreshing";
};

function toneStyles(tone: SnapshotKPI["tone"]) {
  switch (tone) {
    case "good":
      return {
        border: "1px solid rgba(46,229,157,0.18)",
        background: "rgba(46,229,157,0.08)",
        color: "rgba(220,255,236,0.95)",
      };
    case "warn":
      return {
        border: "1px solid rgba(255,159,67,0.18)",
        background: "rgba(255,159,67,0.08)",
        color: "rgba(255,238,214,0.95)",
      };
    case "bad":
      return {
        border: "1px solid rgba(255,107,107,0.18)",
        background: "rgba(255,107,107,0.08)",
        color: "rgba(255,226,226,0.95)",
      };
    default:
      return {
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.035)",
        color: "rgba(255,255,255,0.86)",
      };
  }
}

function formatAgeMs(updatedAt: number) {
  const secs = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function MarketSnapshotBar({
  snapshot,
  status = "live",
}: Props) {
  const items = snapshot?.items ?? [];
  const [ageLabel, setAgeLabel] = useState(() => formatAgeMs(snapshot.updatedAt));

  useEffect(() => {
    setAgeLabel(formatAgeMs(snapshot.updatedAt));

    const id = setInterval(() => {
      setAgeLabel(formatAgeMs(snapshot.updatedAt));
    }, 1000);

    return () => clearInterval(id);
  }, [snapshot.updatedAt]);

  const hasItems = useMemo(() => items.length > 0, [items]);

  return (
    <section
      style={{
        marginTop: 0,
        padding: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 18,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012))",
        boxShadow: "0 12px 34px rgba(0,0,0,0.22)",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 0.35,
                color: "rgba(255,255,255,0.66)",
              }}
            >
              MARKET SNAPSHOT
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Fast read of key market conditions
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <DataStatusBadge status={status} />

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                fontSize: 12,
                color: "rgba(255,255,255,0.72)",
                whiteSpace: "nowrap",
              }}
            >
              Updated · <code>{ageLabel}</code>
            </div>
          </div>
        </div>

        {hasItems ? (
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {items.map((kpi) => (
              <KPIChip key={kpi.key} kpi={kpi} />
            ))}
          </div>
        ) : (
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              padding: "4px 0",
            }}
          >
            No snapshot items available.
          </div>
        )}
      </div>
    </section>
  );
}

function KPIChip({ kpi }: { kpi: SnapshotKPI }) {
  const tone = toneStyles(kpi.tone);

  return (
    <div
      style={{
        ...tone,
        flexShrink: 0,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 14,
        boxShadow: "inset 0 0 10px rgba(255,255,255,0.015)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 0.35,
          opacity: 0.76,
          whiteSpace: "nowrap",
        }}
      >
        {kpi.label}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {kpi.value}
      </div>

      {kpi.sub ? (
        <div
          style={{
            fontSize: 11,
            opacity: 0.68,
            whiteSpace: "nowrap",
          }}
        >
          {kpi.sub}
        </div>
      ) : null}
    </div>
  );
}