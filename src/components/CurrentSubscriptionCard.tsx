"use client";

import { useState } from "react";
import { UI } from "@/lib/ui";

export default function CurrentSubscriptionCard() {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    try {
      setLoading(true);
      setError(null);

      const normalizedApiKey = apiKey.trim();

      if (!normalizedApiKey.startsWith("cl_")) {
        throw new Error("Enter a valid CryptoLink API key");
      }

      const response = await fetch("/api/cryptolink/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: normalizedApiKey }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok || !data?.url) {
        throw new Error(
          data?.message || data?.detail || data?.error || "Unable to open the billing portal"
        );
      }

      window.location.assign(data.url);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Unable to open the billing portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article
      style={{
        overflow: "hidden",
        borderRadius: UI.radiusLg,
        border: `1px solid ${UI.border}`,
        background: UI.panel,
        boxShadow: "0 16px 50px rgba(0,0,0,0.22)",
      }}
    >
      <div
        style={{
          borderBottom: `1px solid ${UI.border}`,
          background: "linear-gradient(90deg, rgba(255,159,67,0.10), transparent)",
          padding: "20px 24px",
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.2em", color: UI.orange, margin: 0 }}>
          Current subscription
        </p>
        <h2 style={{ marginTop: 8, fontSize: 20, fontWeight: 600, color: UI.text }}>
          Manage your CryptoLink plan
        </h2>
        <p style={{ marginTop: 8, maxWidth: 640, fontSize: 14, lineHeight: 1.6, color: UI.muted }}>
          Enter the API key associated with your subscription to securely access the Stripe Billing Portal.
        </p>
      </div>

      <div style={{ padding: 24 }}>
        <label htmlFor="billing-api-key" style={{ fontSize: 14, fontWeight: 500, color: "rgba(230,237,243,0.85)" }}>
          CryptoLink API key
        </label>

        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }} className="lg:flex-row">
          <input
            id="billing-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="cl_••••••••••••••••••••"
            autoComplete="off"
            spellCheck={false}
            style={{
              minWidth: 0,
              flex: 1,
              borderRadius: UI.radius,
              border: `1px solid ${UI.border}`,
              background: "rgba(0,0,0,0.30)",
              padding: "12px 16px",
              fontFamily: "ui-monospace, monospace",
              fontSize: 14,
              color: UI.text,
              outline: "none",
            }}
          />

          <button
            type="button"
            onClick={openPortal}
            disabled={loading || !apiKey.trim()}
            style={{
              borderRadius: UI.radius,
              background: UI.orange,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "#0b0f14",
              border: "none",
              cursor: loading || !apiKey.trim() ? "not-allowed" : "pointer",
              opacity: loading || !apiKey.trim() ? 0.5 : 1,
              transition: "all 140ms ease",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Opening portal..." : "Manage subscription"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              borderRadius: UI.radius,
              border: `1px solid ${UI.red}33`,
              background: `${UI.red}0d`,
              padding: "12px 16px",
              fontSize: 14,
              color: "rgba(255,107,107,0.9)",
            }}
          >
            {error}
          </div>
        )}

        <p style={{ marginTop: 16, fontSize: 12, lineHeight: 1.5, color: "rgba(230,237,243,0.45)" }}>
          Your API key is used only to locate the associated subscription. It is not included in the Stripe redirect URL.
        </p>
      </div>
    </article>
  );
}
