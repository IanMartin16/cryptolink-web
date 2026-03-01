"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI } from "@/lib/ui";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/prices", label: "Prices" },
  { href: "/dashboard/symbols", label: "Symbols" },
  { href: "/dashboard/trends", label: "Trends" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      <div
        className="mx-auto max-w-[1250px] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2"
        style={{
          background: "rgba(0,0,0,0.65)",
          borderTop: `1px solid ${UI.border}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="grid grid-cols-5 gap-2">
          {items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={[
                  "rounded-xl border px-2 py-2 text-center text-[11px] font-semibold transition",
                  active ? "text-white" : "text-white/55 hover:text-white/80",
                ].join(" ")}
                style={{
                  borderColor: active ? "rgba(255,159,67,0.25)" : "rgba(255,255,255,0.08)",
                  background: active ? "rgba(255,159,67,0.10)" : "rgba(255,255,255,0.02)",
                }}
              >
                <span className="block truncate">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}