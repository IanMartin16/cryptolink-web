import { fetchMomentum } from "@/lib/cryptoLink";
import { UI } from "@/lib/ui";

function esDirection(direction: string) {
  if (direction === "up") return "alcista";
  if (direction === "down") return "bajista";
  return "estable";
}

function esStrength(strength: string) {
  if (strength === "high") return "alto";
  if (strength === "medium") return "medio";
  return "bajo";
}

export default async function MomentumPanel() {
  try {
    const data = await fetchMomentum(["BTC", "ETH", "SOL"]);

    return (
      <section
        style={{
          marginTop: UI.gap,
          padding: UI.padLg,
          border: `1px solid ${UI.border}`,
          borderRadius: UI.radiusLg,
          background: UI.panel,
          minWidth: 0,
        }}
      >
        <h2 style={{ margin: 0 }}>Momentum</h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Última actualización: <code>{data.ts}</code>
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {data.momentum.map((m) => {
            const tone =
              m.direction === "up"
                ? "#2BFF88"
                : m.direction === "down"
                ? "#FF6B6B"
                : "rgba(255,255,255,0.92)";

            return (
              <div
                key={m.symbol}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: `1px solid ${UI.border}`,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.75 }}>{m.symbol}</div>

                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: tone }}>
                  {esStrength(m.strength)}
                </div>

                <div style={{ marginTop: 6, fontSize: 14, opacity: 0.85 }}>
                  {esDirection(m.direction)} · {m.changePct.toFixed(2)}%
                </div>

                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.72 }}>
                  Último: {m.last == null ? "N/D" : m.last.toLocaleString()} MXN
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  } catch (e: any) {
    return (
      <section
        style={{
          marginTop: UI.gap,
          padding: UI.padLg,
          border: `1px solid ${UI.border}`,
          borderRadius: UI.radiusLg,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0 }}>Momentum</h2>
        <p style={{ marginTop: 8 }}>
          Error conectando a momentum: <b>{e?.message ?? "unknown"}</b>
        </p>
      </section>
    );
  }
}