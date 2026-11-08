"use client";

import PageHeader from "@/components/PageHeader";
import { HEALTH_OK } from "@/lib/health";
import StatusBar from "@/components/StatusBar";
import CollapseRiskPanel from "@/components/CollapseRiskPanel";

/**
 * Insights — la casa de los HALLAZGOS medidos del ecosistema CryptoLink.
 *
 * Distinto de Derived Intelligence (señales interpretativas, narrativa de
 * mercado): aquí cada panel es un dato DERIVADO y VERIFICADO con su n, ventana
 * y método visibles — no dato crudo ni interpretación. Ganan su lugar solo si
 * responden algo medible que ningún panel de datos responde.
 *
 * Primer insight: Collapse Risk (base rate del detector, 2 meses de observación).
 * Los paneles son autónomos (se auto-alimentan con su propio fetch); aquí solo
 * se montan en orden. No reciben props.
 */
export default function InsightsPage() {
  return (
    <div>
      <PageHeader
        title="Insights"
        subtitle="Measured findings · base rates · derived research"
        health={HEALTH_OK}
        badge="INSIGHTS"
      />
      <StatusBar
        items={[{ label: "Insights", ok: true }]}
        trailingLabel="measured findings · derived research"
      />

      {/* Primer insight — el detector de colapso */}
      <div className="min-h-[360px]">
        <CollapseRiskPanel />
      </div>

      {/* Próximos insights se montan aquí en orden */}
    </div>
  );
}
