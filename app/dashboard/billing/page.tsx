import CurrentSubscriptionCard from "@/components/CurrentSubscriptionCard";
import PlanCard from "@/components/PlanCard";

export const metadata = {
  title: "Plans & Billing | CryptoLink",
  description:
    "Manage your CryptoLink subscription and available plans.",
};

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-400">
          CryptoLink account
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Plans & Billing
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Manage your active subscription or explore the plans
          currently available through Evilink.
        </p>
      </header>

      <CurrentSubscriptionCard />

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">
            Available plans
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            New subscriptions are currently completed through the
            Evilink portal.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
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
              "Advanced trends",
              "Social Pulse access",
            ]}
            purchaseUrl="https://evilink.dev/#cryptolink"
            highlighted
          />
        </div>
      </section>
    </div>
  );
}