// lib/cryptolink/docs.ts
export type PlanName = "FREE" | "BUSINESS" | "PRO";

export type EndpointDoc = {
  id: string;
  title: string;
  method: "GET" | "POST";
  path: string;
  auth: "x-api-key" | "none";
  query?: { name: string; required?: boolean; example?: string; notes?: string }[];
  body?: { name: string; required?: boolean; example?: string; notes?: string }[];
  examples: {
    title: string;
    lang: "curl" | "js";
    code: string;
  }[];
  responses?: {
    status: number;
    description: string;
    example?: string;
  }[];
};

export const cryptolinkDocs = {
  schema: "evilink.docs.v1",
  product: {
    slug: "cryptolink",
    name: "CryptoLink",
    tagline: "Precios cripto + streaming SSE en tiempo real",
  },
  version: "1.0.0",
  updatedAt: "2026-03-02T00:00:00.000Z",
  baseUrl:
    process.env.NEXT_PUBLIC_CRYPTOLINK_API_BASE?.replace(/\/+$/, "") ||
    "https://cryptolink-production.up.railway.app",
  auth: {
    header: "x-api-key",
    note: "Usa tu API key en el header x-api-key. La recibes por correo al confirmarse el pago.",
  },

  // ⚠️ Esto lo conectamos con tu tema de 13 symbols:
  // - “maxSymbolsPlan” es límite por plan
  // - “availableSymbolsToday” es lo que REALMENTE soportas hoy
  limits: {
    maxSymbolsPlan: {
      FREE: 3,
      BUSINESS: 15,
      PRO: 27,
    } as Record<PlanName, number>,
    availableSymbolsToday: 27, // <-- tu situación actual
  },

  sections: [
    {
      id: "quickstart",
      title: "Quickstart",
      body: [
        "Base URL y header de auth.",
        "Ejemplos listos con curl para REST y SSE.",
      ],
    },
    {
      id: "endpoints",
      title: "Endpoints",
      body: [
        "Lista de endpoints principales y cómo usarlos.",
        "Incluye ejemplos y respuestas típicas.",
      ],
    },
    {
      id: "limits",
      title: "Planes y límites",
      body: [
        "Límites por plan: requests/min, SSE concurrentes y maxSymbols.",
        "Errores: 400 (symbols), 401 (api key), 429 (rate limit).",
      ],
    },
    {
      id: "errors",
      title: "Errores y debugging",
      body: [
        "Usa X-Request-Id para soporte y correlación.",
        "Reintentos recomendados para 5xx.",
      ],
    },
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
          code:
`curl -s "https://cryptolink-production.up.railway.app/v1/prices?symbols=BTC,ETH&fiat=MXN" \\
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
    {
      id: "sse_prices",
      title: "Streaming SSE de precios",
      method: "GET",
      path: "/v1/stream/prices",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH", notes: "CSV, sin espacios." },
        { name: "fiat", required: false, example: "MXN", notes: "Default sugerido: MXN."},
      ],
      examples: [
        {
          title: "curl (SSE)",
          lang: "curl",
          code:
`curl -N "https://cryptolink-production.up.railway.app/v1/stream/prices?symbols=BTC,ETH&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        { status: 200, description: "Stream abierto (SSE). Verás event: ping (keepalive) y event: price." },
        { status: 401, description: "API key inválida o faltante" },
        { status: 429, description: "Rate limit / SSE limit excedido" },
      ],
    },
  ],

  // “Nexus-friendly”: mini FAQ + keywords (mejora retrieval)
  bot: {
    keywords: ["cryptolink", "prices", "sse", "x-api-key", "rate limit", "checkout", "plans"],
    faq: [
      { q: "¿Cómo autentico?", a: "Con el header x-api-key: TU_API_KEY." },
      { q: "¿Qué significa event: ping en SSE?", a: "Es keepalive para mantener la conexión viva." },
      { q: "¿Qué error sale si excedo límite?", a: "429 para rate limit. 400 si excedes symbols permitidos." },
    ],
  },
} as const;
