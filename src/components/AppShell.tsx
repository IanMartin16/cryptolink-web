"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI } from "@/lib/ui";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)"); // 👈 sube a 900 para incluir iPhone y tablets pequeñas
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const items = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/prices", label: "Prices" },
    { href: "/dashboard/trends", label: "Trends" },
    { href: "/dashboard/symbols", label: "Symbols" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  const Aside = (
    <aside
      style={{
        borderRight: `1px solid ${UI.border}`,
        padding: 18,
        background: "rgba(255,255,255,0.02)",
        height: "100%",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.03)",
            boxShadow: "0 0 18px rgba(255,159,67,0.12)",
            overflow: "hidden",
          }}
        >
          <img
            src="/brand/cryptolink.png"
            alt="CL"
            style={{ width: 22, height: 22, objectFit: "contain" }}
          />
        </div>

        <div>
          <div style={{ fontSize: 16, fontWeight: 950, letterSpacing: 0.2 }}>
            <span style={{ color: UI.orange }}>CryptoLink </span>V3.0
          </div>
          <div style={{ marginTop: 2, fontSize: 12, opacity: 0.7 }}>Dashboard</div>
        </div>
      </div>

      <nav style={{ marginTop: 18, display: "grid", gap: 8 }}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: active ? "1px solid rgba(255,159,67,0.22)" : "1px solid rgba(255,255,255,0.08)",
                  background: active ? "rgba(255,159,67,0.08)" : "transparent",
                  cursor: "pointer",
                  fontWeight: active ? 900 : 650,
                  opacity: active ? 1 : 0.9,
                  transition: "all 140ms ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onClick={() => setOpen(false)} // 👈 cierra en mobile
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: active ? UI.orangeSoft : "rgba(255,255,255,0.18)",
                      boxShadow: active ? "0 0 12px rgba(255,159,67,0.28)" : "none",
                      transition: "all 140ms ease",
                    }}
                  />
                  {item.label}
                </span>

                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: active ? UI.orangeSoft : "transparent",
                    boxShadow: active ? "0 0 14px rgba(255,159,67,0.32)" : "none",
                  }}
                />
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        // ✅ MOBILE: 1 columna (sin sidebar fija)
        gridTemplateColumns: isMobile ? "1fr" : "268px 1fr",
        background: UI.bg,
        color: UI.text,
        fontFamily: "system-ui",
      }}
    >
      {/* ✅ Desktop sidebar */}
      {!isMobile ? Aside : null}

      {/* ✅ Mobile topbar + drawer */}
      {isMobile ? (
        <>
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              borderBottom: `1px solid ${UI.border}`,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)",
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <button
              onClick={() => setOpen(true)}
              style={{
                border: `1px solid ${UI.border}`,
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.85)",
                borderRadius: 12,
                padding: "8px 10px",
                fontWeight: 900,
              }}
              aria-label="Open menu"
            >
              ☰
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <img src="/brand/cryptolink.png" alt="CL" style={{ width: 22, height: 22 }} />
              <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ color: UI.orange }}>CryptoLink </span>V3.0
              </div>
            </div>

            <div style={{ fontSize: 12, opacity: 0.7, whiteSpace: "nowrap" }}>LIVE</div>
          </div>

          {open ? (
            <div
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                background: "rgba(0,0,0,0.55)",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: "82%",
                  maxWidth: 320,
                  borderRight: `1px solid ${UI.border}`,
                  background: UI.bg,
                }}
              >
                {Aside}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* Main */}
      <main
        style={{
          padding: isMobile ? 12 : 24, // ✅ mobile padding menor
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -200,
            background:
              "radial-gradient(600px 360px at 70% 10%, rgba(255,159,67,0.10), transparent 60%), radial-gradient(520px 320px at 20% 30%, rgba(46,229,157,0.06), transparent 60%)",
            pointerEvents: "none",
            filter: "blur(2px)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1250, margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}