import type { SocialLinkBasicSignalsResponse } from "@/lib/social/liveNarrative";

export async function fetchBasicSignals(args?: {
  window?: "15m" | "30m" | "1h" | "4h";
  assets?: string[];
  limit?: number;
}): Promise<SocialLinkBasicSignalsResponse> {
  const params = new URLSearchParams();

  if (args?.window) params.set("window", args.window);
  if (args?.assets?.length) params.set("assets", args.assets.join(","));
  if (typeof args?.limit === "number") params.set("limit", String(args.limit));

  const qs = params.toString();
  const res = await fetch(`/api/social/basic-signals${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`basic-signals HTTP ${res.status}`);
  }

  return res.json();
}