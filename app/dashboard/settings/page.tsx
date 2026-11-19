"use client";

import PageHeader from "@/components/PageHeader";
import FiatToggle from "@/components/FiatToggle";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Preferences"
        subtitle="display settings"
        badge="BETA"
      />

      <div className="mt-2 text-[14px] text-white/45">
        These preferences are stored locally on this device.
      </div>

      {/* Fiat */}
      <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
        <div className="grid gap-1">
          <div className="text-[11px] font-semibold tracking-[0.16em] text-amber-300/80">
            DEFAULT FIAT
          </div>
          <div className="text-sm text-white/52">
            Quote currency used across the market cards.
          </div>
        </div>

        <div className="mt-3">
          <FiatToggle />
        </div>
      </section>
    </div>
  );
}