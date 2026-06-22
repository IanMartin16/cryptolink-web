import CurrentSubscriptionCard from "@/components/CurrentSubscriptionCard";
import PlanCard from "@/components/PlanCard";
import { UI } from "@/lib/ui";

export const metadata = {
  title: "Plans & Billing | CryptoLink",
  description: "Manage your CryptoLink subscription and available plans.",
};

export default function BillingPage() {
  return (
    <div style={{ display: "grid", gap: 32 }}>
      <header>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.22em", color: UI.orange, margin: 0 }}>
          CryptoLink account
        </p>
        <h1 style={{ marginTop: 8, fontSize: 30, fontWeight: 700, color: UI.text }}>
          Plans &amp; Billing
        </h1>
        <p style={{ marginTop: 8, maxWidth: 640, fontSize: 14, lineHeight: 1.6, color: UI.muted }}>
          Manage your active subscription or explore the plans currently available through Evilink.
        </p>
      </header>

      <CurrentSubscriptionCard />

      <section>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: UI.text, margin: 0 }}>
            Available plans
          </h2>
          <p style={{ marginTop: 4, fontSize: 14, color: "rgba(230,237,243,0.55)" }}>
            New subscriptions are currently completed through the Evilink portal.
          </p>
        </div>

        <div style={{ display: "grid", gap: 16 }} className="xl:grid-cols-2">
          <PlanCard
            name="Business"
            description="Reliable market data for production applications and business integrations."
            features={[
              "Production API access",
              "Expanded market coverage",
              "Business usage limits",
            ]}
            purchaseUrl="https://evilink.dev/#cryptolink"
          />

          <PlanCard
            name="Pro"
            description="Advanced capabilities for higher-volume and intelligence-driven workflows."
            features={[
              "Higher request limits",
              "Advanced derived signals",
              "Priority market coverage",
            ]}
            purchaseUrl="https://evilink.dev/#cryptolink"
            highlighted
          />
        </div>
      </section>
    </div>
  );
}
