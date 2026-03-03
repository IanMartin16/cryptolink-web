export type PlanName = "FREE" | "BUSINESS" | "PRO";

export type ParamDoc = {
  name: string;
  required?: boolean;
  example?: string;
  notes?: string;
};

export type ResponseDoc = {
  status: number;
  description: string;
  example?: string;
};

export type EndpointDoc = {
  id: string;
  title: string;
  method: "GET" | "POST";
  path: string;
  auth: "x-api-key" | "none";
  query?: ParamDoc[];
  body?: ParamDoc[];
  examples: { title: string; lang: "curl" | "js"; code: number | string}[];
  responses?: ResponseDoc[];
};

export type CryptoLinkDocsSchema = {
  schema: string;
  product: { slug: string; name: string; tagline: string };
  version: string;
  updatedAt: string; // ✅ fijo (no Date())
  baseUrl: string;
  auth: { header: string; note: string };
  limits: {
    maxSymbolsPlan: Record<PlanName, number>;
    availableSymbolsToday: number;
  };
  sections: { id: string; title: string; body: string[] }[];
  endpoints: EndpointDoc[];
};

export const cryptolinkDocs = {
  schema: "evilink.docs.v1",
  product: {
    slug: "cryptolink",
    name: "CryptoLink",
    tagline: "Precios cripto + streaming SSE en tiempo real",
  },
  version: "1.0.0",
  updatedAt: "2026-03-02", // ✅ fija

  baseUrl:
    process.env.NEXT_PUBLIC_CRYPTOLINK_API_BASE?.replace(/\/+$/, "") ||
    "https://cryptolink-production.up.railway.app",

  auth: {
    header: "x-api-key",
    note: "Para producción usa tu API key en el header x-api-key. En estos docs mostramos ejemplos públicos.",
  },

  limits: {
    maxSymbolsPlan: { FREE: 3, BUSINESS: 15, PRO: 27 },
    availableSymbolsToday: 27,
  },

  sections: [
    { id: "quickstart", title: "Quickstart", body: ["Base URL", "Ejemplos curl REST y SSE listos"] },
    { id: "endpoints", title: "Endpoints", body: ["Endpoints principales con parámetros y ejemplos"] },
    { id: "limits", title: "Planes y límites", body: ["Límites por plan y errores típicos (400/401/429)"] },
    { id: "errors", title: "Errores y debugging", body: ["Usa X-Request-Id para soporte", "Reintentos recomendados para 5xx"] },
  ],

  endpoints: [
    {
      id: "prices",
      title: "Precios por symbols",
      method: "GET",
      path: "/v1/prices",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH", notes: "CSV, sin espacios." },
        { name: "fiat", required: false, example: "MXN", notes: "Default sugerido: MXN." },
      ],
      examples: [
        {
          title: "curl (REST)",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/prices?symbols=BTC,ETH&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        { status: 200, description: "OK", example: `{"prices":{"BTC":123,"ETH":456},"fiat":"MXN","ts":"...","source":"..."}` },
        { status: 401, description: "API key inválida o faltante" },
        { status: 400, description: "Symbols inválidos o excede el máximo del plan" },
        { status: 429, description: "Rate limit excedido" },
      ],
    },
  ],
} satisfies CryptoLinkDocsSchema;