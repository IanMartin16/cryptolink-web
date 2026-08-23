"use client";

import PageHeader from "@/components/PageHeader";
import { HEALTH_OK } from "@/lib/health";
import MarketIntelligencePanel from "@/components/MarketIntelligencePanel";
import SocialPulseBoard from "@/components/SocialPulseBoard";
import SignalsRadarPanel from "@/components/SignalsRadarPanel";
import StatusBar from "@/components/StatusBar";

/**
 * Derived Intelligence — la casa de la interpretación/derivados.
 *
 * Reúne los paneles analíticos que antes estaban dispersos y compitiendo por
 * foco en secciones de datos crudos:
 *   - MarketIntelligencePanel: estaba enterrado al fondo de Market 360°.
 *   - SocialPulseBoard: regresa (estaba fuera).
 *   - SignalsRadarPanel: salió de Prices, donde le robaba foco a Top Movers.
 *
 * Los tres son autónomos (se auto-alimentan con sus propios hooks/fetch), así
 * que aquí solo se montan en orden. No reciben props.
 */

export default function DerivedIntelligencePage() {
  return (
    <div>
      <PageHeader
        title="Derived Intelligence"
        subtitle="Interpretive signals · market narrative · derived analytics"
        health={HEALTH_OK}
        badge="DERIVED"
      />
      <StatusBar
        items={[{ label: "Derived Intelligence", ok: true }]}
        trailingLabel="interpretive signals · derived analytics"
      />

      {/* Orden decidido: intelligence arriba, narrativa en medio, radar abajo */}
      <div className="min-h-[320px]">
        <MarketIntelligencePanel />
      </div>

      <div className="min-h-[320px]">
        <SignalsRadarPanel />
      </div>

      <div className="min-h-[320px]">
        <SocialPulseBoard />
      </div>

    </div>
  );
}
