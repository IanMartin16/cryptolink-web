"use client";

import PageHeader from "@/components/PageHeader";
import { HEALTH_OK } from "@/lib/health";
import MarketIntelligencePanel from "@/components/MarketIntelligencePanel";
import MarketStructurePanel from "@/components/MarketStructurePanel";
import MarketBreadthPanel from "@/components/MarketBreadthPanel";
import DivergencePanel from "@/components/DivergencePanel"
import StatusBar from "@/components/StatusBar";


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
      <div className="min-h-[180px]">
      <MarketBreadthPanel /> 
      </div>

      <div className="min-h-[280px]">
        <DivergencePanel />
      </div>

      <div className="min-h-[320px]">
        <MarketIntelligencePanel />
      </div>

      <div className="min-h-[280px]">
        <MarketStructurePanel />
      </div>

    </div>
  );
}
