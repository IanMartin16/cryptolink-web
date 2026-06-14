"use client";

import { useState } from "react";

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: normalizedApiKey,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok || !data?.url) {
        throw new Error(
          data?.message ||
            data?.detail ||
            data?.error ||
            "Unable to open the billing portal"
        );
      }

      window.location.assign(data.url);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to open the billing portal"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-orange-400/25 bg-[#0d1017] shadow-[0_0_40px_rgba(249,115,22,0.05)]">
      <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-transparent px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
          Current subscription
        </p>

        <h2 className="mt-2 text-xl font-semibold text-white">
          Manage your CryptoLink plan
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Enter the API key associated with your subscription to
          securely access Stripe Billing Portal.
        </p>
      </div>

      <div className="p-6">
        <label
          htmlFor="billing-api-key"
          className="text-sm font-medium text-zinc-300"
        >
          CryptoLink API key
        </label>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row">
          <input
            id="billing-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="cl_••••••••••••••••••••"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-500/10"
          />

          <button
            type="button"
            onClick={openPortal}
            disabled={loading || !apiKey.trim()}
            className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Opening portal..."
              : "Manage subscription"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-zinc-600">
          Your API key is used only to locate the associated
          subscription. It is not included in the Stripe redirect
          URL.
        </p>
      </div>
    </article>
  );
}