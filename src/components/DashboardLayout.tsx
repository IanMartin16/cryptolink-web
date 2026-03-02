import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "12px",            // ✅ base mobile
        fontFamily: "system-ui",
        background: "#0b0f14",
        color: "#e6edf3",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 4px",         // ✅ micro padding interno
        }}
      >
        {children}
      </div>

      <style jsx global>{`
        @media (min-width: 640px) {
          body { }
        }
      `}</style>
    </div>
  );
}