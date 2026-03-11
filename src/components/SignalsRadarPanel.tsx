"use client";

import { useEffect, useMemo, useState } from "react";
import { UI } from "@/lib/ui";
import { fetchSignals } from "@/lib/cryptoLink";
import { useMarketSignalsStore } from "@/lib/stores/marketSignalsStore";
import DataStatusBadge from "./DataStatusBadge";

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

function formatTs(ts: string) {
  try {
    const d = new Date(ts);
    return (
      new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Mexico_City",
      }).format(d) + " Mexico City"
    );
  } catch {
    return ts;
  }
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  };
}

function polygonPath(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export default function SignalsRadarPanel() {
  const storedSignals = useMarketSignalsStore((s) => s.signals);
  const setSignalsStore = useMarketSignalsStore((s) => s.setSignals);

  const [data, setData] = useState<SignalsResponse | null>(storedSignals);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"live" | "restored" | "refreshing">(
    storedSignals ? "restored" : "refreshing"
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError("");
        const res = await fetchSignals(["BTC", "ETH", "SOL"]);
        if (!cancelled) 
            setData(res);
            setSignalsStore(res);
            setStatus("live");
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "unknown");
      }
    }

    load();
    const id = setInterval(load, 10000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 92;

  const chart = useMemo(() => {
    const signals = data?.signals ?? [];
    const count = signals.length || 4;
    const angleStep = 360 / count;

    const rings = [0.25, 0.5, 0.75, 1];

    const axes = signals.map((s, i) => {
      const angle = i * angleStep;
      const end = polarToCartesian(cx, cy, maxR, angle);
      const labelPos = polarToCartesian(cx, cy, maxR + 26, angle);
      return { ...s, angle, end, labelPos };
    });

    const points = axes.map((a) =>
      polarToCartesian(cx, cy, maxR * (Math.max(0, Math.min(100, a.value)) / 100), a.angle)
    );

    return { rings, axes, points };
  }, [data]);

  if (error) {
    return (
      <section
        style={{
          marginTop: 0,
          padding: 16,
          border: `1px solid ${UI.border}`,
          borderRadius: 18,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>Signals Radar</h2>
        <p style={{ marginTop: 8 }}>
          Error conectando a señales: <b>{error}</b>
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section
        style={{
          marginTop: 0,
          padding: 16,
          border: `1px solid ${UI.border}`,
          borderRadius: 18,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>Signals Radar</h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Cargando señales...</p>
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: 0,
        padding: 16,
        border: `1px solid ${UI.border}`,
        borderRadius: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
        minWidth: 0,
        overflow: "hidden",
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
          <h2 style={{ margin: 0, fontSize: 20 }}>Signals Radar</h2>
          <p style={{ marginTop: 8, opacity: 0.78, fontSize: 13 }}>
            Lectura multidimensional de señales internas de CryptoLink.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <DataStatusBadge status={status} />

        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.05)",
            fontSize: 12,
            opacity: 0.82,
            whiteSpace: "nowrap",
          }}
        >
          Actualizado · <code>{formatTs(data.ts)}</code>
        </div>
       </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div style={{ display: "grid", placeItems: "center" }}>
          <svg
            viewBox={`0 0 ${size} ${size}`}
            width="100%"
            style={{ maxWidth: 320, overflow: "visible" }}
          >
            {chart.rings.map((r, idx) => (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={maxR * r}
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1"
              />
            ))}

            {chart.axes.map((a, idx) => (
              <g key={idx}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={a.end.x}
                  y2={a.end.y}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                />
                <text
                  x={a.labelPos.x}
                  y={a.labelPos.y}
                  fill="rgba(255,255,255,0.82)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {a.label}
                </text>
              </g>
            ))}

            <polygon
              points={polygonPath(chart.points)}
              fill="rgba(43,255,136,0.18)"
              stroke="#2BFF88"
              strokeWidth="2"
            />

            {chart.points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#2BFF88"
                stroke="rgba(0,0,0,0.18)"
              />
            ))}
          </svg>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          {data.signals.map((s) => (
            <div
              key={s.label}
              style={{
                padding: 12,
                borderRadius: 14,
                border: `1px solid ${UI.border}`,
                background: "rgba(255,255,255,0.045)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.75 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}