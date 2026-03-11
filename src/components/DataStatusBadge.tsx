"use client";

type DataStatus = "live" | "restored" | "refreshing";

export default function DataStatusBadge({ status }: { status: DataStatus }) {
  const tone =
    status === "live"
      ? { color: "#2BFF88", bg: "rgba(43,255,136,0.10)", border: "rgba(43,255,136,0.22)" }
      : status === "refreshing"
      ? { color: "#F7C65F", bg: "rgba(247,198,95,0.10)", border: "rgba(247,198,95,0.22)" }
      : { color: "rgba(255,255,255,0.88)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)" };

  const label =
    status === "live"
      ? "live"
      : status === "refreshing"
      ? "refreshing"
      : "restored";

  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        color: tone.color,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        minWidth: 96,
        textAlign: "center",
        justifyContent: "center",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {label}
    </div>
  );
}