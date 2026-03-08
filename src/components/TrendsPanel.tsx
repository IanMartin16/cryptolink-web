import { fetchTrends } from "@/lib/socialLink";
import { UI } from "@/lib/ui";

export default async function TrendsPanel() {
  try {
    const trends = await fetchTrends(["BTC", "ETH"]);

    return (
      <section
        style={{
          marginTop: UI.gap,
          padding: UI.padLg,
          border: `1px solid ${UI.border}`,
          borderRadius: UI.radiusLg,
          background: UI.panel,
          position: "relative",
          overflow: "hidden",
          minHeight: 300,
          minWidth: 0,
        }}
      >
        <h2 style={{ margin: 0 }}>Trends (CryptoLink)</h2>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Última actualización: <code>{trends.ts}</code>
        </p>

        <ul>
          {trends.data.map((t) => (
            <li key={t.symbol}>
              <b>{t.symbol}</b> → {t.trend} (score {t.score}) — {t.reason}
            </li>
          ))}
        </ul>
      </section>
    );
  } catch (e: any) {
    return (
      <section
        style={{
          marginTop: 16,
          padding: 16,
          border: `1px solid ${UI.border}`,
          borderRadius: 14,
          background: UI.panel,
        }}
      >
        <h2 style={{ margin: 0 }}>Trends (CryptoLink)</h2>
        <p style={{ marginTop: 8 }}>
          Error conectando a CryptoLink trends: <b>{e?.message ?? "unknown"}</b>
        </p>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Revisa la route interna de trends y la configuración del backend.
        </p>
      </section>
    );
  }
}