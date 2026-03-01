"use client";

import React, { useEffect, useState } from "react";
import { UI } from "@/lib/ui";

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn";
}) {
  const border =
    tone === "good"
      ? "rgba(46,229,157,0.22)"
      : tone === "warn"
      ? "rgba(255,159,67,0.22)"
      : "rgba(255,255,255,0.12)";
  const bg =
    tone === "good"
      ? "rgba(46,229,157,0.10)"
      : tone === "warn"
      ? "rgba(255,159,67,0.10)"
      : "rgba(255,255,255,0.04)";
  const color =
    tone === "good"
      ? UI.green
      : tone === "warn"
      ? UI.orangeSoft
      : "rgba(255,255,255,0.80)";

  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        fontSize: 12,
        fontWeight: 900,
        color,
        whiteSpace: "nowrap",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        flex: "0 0 auto",
      }}
    >
      {children}
    </span>
  );
}

export default function TopHeader({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "flex-start",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
        padding: "12px 14px",
        borderRadius: 16,
        border: `1px solid ${UI.border}`,
        background: "rgba(255,255,255,0.02)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      {/* LEFT */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: isMobile ? 38 : 44,
            height: isMobile ? 38 : 44,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${UI.border}`,
            background: "rgba(255,255,255,0.03)",
            boxShadow: "0 0 22px rgba(255,159,67,0.18)",
            overflow: "hidden",
            flex: "0 0 auto",
          }}
        >
          <img
            src="/brand/cryptolink.png"
            alt="CryptoLink"
            style={{ width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, objectFit: "contain" }}
          />
        </div>

        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div
            style={{
              fontSize: isMobile ? 18 : 26,
              fontWeight: 950,
              letterSpacing: 0.2,
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={typeof title === "string" ? title : undefined}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                opacity: 0.75,
                // ✅ en mobile permitimos 2 líneas (no nowrap)
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: isMobile ? 2 : 1,
                WebkitBoxOrient: "vertical",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      {/* RIGHT */}
      {right ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: isMobile ? "flex-start" : "flex-end",
            // ✅ mobile: scroll horizontal (nunca amontona)
            flexWrap: isMobile ? "nowrap" : "wrap",
            overflowX: isMobile ? "auto" : "visible",
            WebkitOverflowScrolling: "touch",
            maxWidth: "100%", // ✅ quita 52% para mobile
            minWidth: 0,
            paddingBottom: isMobile ? 2 : 0,
          }}
        >
          {right}
        </div>
      ) : null}
    </div>
  );
}

export { Chip };