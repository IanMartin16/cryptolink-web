import { UI } from "@/lib/ui";

type PlanCardProps = {
  name: string;
  description: string;
  features: string[];
  purchaseUrl: string;
  highlighted?: boolean;
};

export default function PlanCard({
  name,
  description,
  features,
  purchaseUrl,
  highlighted = false,
}: PlanCardProps) {
  return (
    <article
      style={{
        borderRadius: UI.radiusLg,
        padding: UI.padLg,
        background: UI.panel2,
        border: highlighted
          ? `1px solid rgba(255,159,67,0.40)`
          : `1px solid ${UI.border}`,
        boxShadow: highlighted ? "0 0 35px rgba(255,159,67,0.08)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: UI.text, margin: 0 }}>{name}</h3>

        {highlighted && (
          <span
            style={{
              borderRadius: 999,
              border: `1px solid rgba(255,159,67,0.30)`,
              background: "rgba(255,159,67,0.10)",
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: UI.orangeSoft,
              whiteSpace: "nowrap",
            }}
          >
            Advanced
          </span>
        )}
      </div>

      <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: UI.muted }}>
        {description}
      </p>

      <ul style={{ marginTop: 20, listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {features.map((feature) => (
          <li key={feature} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "rgba(230,237,243,0.85)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: UI.orange, flexShrink: 0 }} />
            {feature}
          </li>
        ))}
      </ul>

      <a
        href={purchaseUrl}
        style={{
          marginTop: 24,
          display: "inline-flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: UI.radius,
          padding: "12px 16px",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          transition: "all 140ms ease",
          ...(highlighted
            ? { background: UI.orange, color: "#0b0f14" }
            : { border: `1px solid rgba(255,159,67,0.30)`, color: UI.orangeSoft }),
        }}
      >
        View plan on Evilink
      </a>
    </article>
  );
}
