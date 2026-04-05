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
  examples: { title: string; lang: "curl" | "js"; code: number | string }[];
  responses?: ResponseDoc[];
};

export type CryptoLinkDocsSchema = {
  schema: string;
  product: { slug: string; name: string; tagline: string };
  version: string;
  updatedAt: string;
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
    tagline: "Crypto market data and lightweight analytics signals",
  },

  version: "2.5.0",
  updatedAt: "2026-03-13",

  baseUrl:
    process.env.NEXT_PUBLIC_CRYPTOLINK_API_BASE?.replace(/\/+$/, "") ||
    "https://cryptolink-production.up.railway.app",

  auth: {
    header: "x-api-key",
    note: "Use your API key in the x-api-key header for production requests. Public examples are simplified for documentation purposes.",
  },

  limits: {
    maxSymbolsPlan: { FREE: 3, BUSINESS: 15, PRO: 25 },
    availableSymbolsToday: 30,
  },

  sections: [
    {
      id: "quickstart",
      title: "Quickstart",
      body: [
        "Base URL",
        "Authentication with x-api-key",
        "REST examples for direct market data and derived signals",
      ],
    },
    {
      id: "signals",
      title: "Signals",
      body: [
        "CryptoLink v3.0 includes direct data, derived signals, and interpretive layers.",
        "Available signal families include Trends, Movers, Momentum, Regime, Risk Flags, Anomalies, and Market Health.",
      ],
    },
    {
      id: "endpoints",
      title: "Endpoints",
      body: [
        "Direct endpoints return market data.",
        "Derived endpoints return internal analytics signals.",
        "Interpretive endpoints return health, risk, and anomaly views.",
      ],
    },
    {
      id: "limits",
      title: "Plans & Limits",
      body: [
        "Plan limits are enforced by symbol count.",
        "Typical client errors include 400, 401, and 429 responses.",
      ],
    },
    {
      id: "errors",
      title: "Errors & Debugging",
      body: [
        "Use X-Request-Id for support and debugging flows.",
        "Retry logic is recommended for transient 5xx responses.",
      ],
    },
  ],

  endpoints: [
    {
      id: "price",
      title: "Single price",
      method: "GET",
      path: "/v1/price",
      auth: "x-api-key",
      query: [
        { name: "symbol", required: true, example: "BTC", notes: "Single asset symbol." },
        { name: "fiat", required: false, example: "MXN", notes: "Default suggested fiat: MXN." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/price?symbol=BTC&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "OK",
          example: `{"ok":true,"symbol":"BTC","fiat":"MXN","price":1234567.89,"ts":"...","source":"..."}`,
        },
        { status: 401, description: "Missing or invalid API key" },
        { status: 400, description: "Invalid symbol or request format" },
        { status: 429, description: "Rate limit exceeded" },
      ],
    },

    {
      id: "prices",
      title: "Prices by symbols",
      method: "GET",
      path: "/v1/prices",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH", notes: "CSV list, no spaces." },
        { name: "fiat", required: false, example: "MXN", notes: "Default suggested fiat: MXN." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/prices?symbols=BTC,ETH&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "OK",
          example: `{"ok":true,"prices":{"BTC":123,"ETH":456},"fiat":"MXN","ts":"...","source":"..."}`,
        },
        { status: 401, description: "Missing or invalid API key" },
        { status: 400, description: "Invalid symbols or plan symbol limit exceeded" },
        { status: 429, description: "Rate limit exceeded" },
      ],
    },

    {
      id: "snapshot",
      title: "Market snapshot",
      method: "GET",
      path: "/v1/snapshot",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: false, example: "BTC,ETH,SOL", notes: "Optional symbol set." },
        { name: "fiat", required: false, example: "MXN", notes: "Fiat display currency." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/snapshot?symbols=BTC,ETH,SOL&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "OK",
          example: `{"ok":true,"fiat":"MXN","ts":"...","source":"...","snapshot":{"mood":"neutral","summary":"..."}}`,
        },
      ],
    },

    {
      id: "trends",
      title: "Trends",
      method: "GET",
      path: "/v1/trends",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH,SOL", notes: "CSV list of assets." },
        { name: "fiat", required: false, example: "MXN", notes: "Optional fiat currency." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/trends?symbols=BTC,ETH,SOL&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Derived trend signals",
          example: `{"ok":true,"fiat":"MXN","ts":"...","source":"internal-analysis","trends":[{"symbol":"BTC","direction":"flat","changePct":0.18,"score":0.18}]}`,
        },
      ],
    },

    {
      id: "movers",
      title: "Movers",
      method: "GET",
      path: "/v1/movers",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH,SOL", notes: "CSV list of assets." },
        { name: "fiat", required: false, example: "MXN", notes: "Optional fiat currency." },
        { name: "limit", required: false, example: "3", notes: "Maximum movers returned per side." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/movers?symbols=BTC,ETH,SOL&fiat=MXN&limit=3" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Relative movers",
          example: `{"ok":true,"fiat":"MXN","ts":"...","source":"internal-analysis","gainers":[],"losers":[]}`,
        },
      ],
    },

    {
      id: "momentum",
      title: "Momentum",
      method: "GET",
      path: "/v1/momentum",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH,SOL", notes: "CSV list of assets." },
        { name: "fiat", required: false, example: "MXN", notes: "Optional fiat currency." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/momentum?symbols=BTC,ETH,SOL&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Momentum signal read",
          example: `{"ok":true,"fiat":"MXN","ts":"...","source":"internal-analysis","momentum":[{"symbol":"BTC","direction":"flat","strength":"low","score":0.0}]}`,
        },
      ],
    },

    {
      id: "regime",
      title: "Market regime",
      method: "GET",
      path: "/v1/regime",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH,SOL", notes: "CSV list of assets." },
        { name: "fiat", required: false, example: "MXN", notes: "Optional fiat currency." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/regime?symbols=BTC,ETH,SOL&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Aggregate market regime",
          example: `{"ok":true,"fiat":"MXN","ts":"...","source":"internal-analysis","regime":{"state":"neutral","score":0.10,"confidence":0.07,"summary":"Signals indicate a stable market with no dominant direction."}}`,
        },
      ],
    },

    {
      id: "risk-flags",
      title: "Risk flags",
      method: "GET",
      path: "/v1/risk-flags",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH,SOL", notes: "CSV list of assets." },
        { name: "fiat", required: false, example: "MXN", notes: "Optional fiat currency." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/risk-flags?symbols=BTC,ETH,SOL&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Interpretive risk layer",
          example: `{"ok":true,"fiat":"MXN","ts":"...","source":"internal-analysis","flags":[{"code":"low_confidence_regime","severity":"medium","title":"Low regime confidence","detail":"..."}],"summary":"Weak or mixed signals currently dominate."}`,
        },
      ],
    },

    {
      id: "anomalies",
      title: "Anomalies",
      method: "GET",
      path: "/v1/anomalies",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH,SOL", notes: "CSV list of assets." },
        { name: "fiat", required: false, example: "MXN", notes: "Optional fiat currency." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/anomalies?symbols=BTC,ETH,SOL&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Anomaly detection layer",
          example: `{"ok":true,"fiat":"MXN","ts":"...","source":"internal-analysis","anomalies":[],"summary":"No relevant anomalies detected at this time."}`,
        },
      ],
    },

    {
      id: "market-health",
      title: "Market health",
      method: "GET",
      path: "/v1/market-health",
      auth: "x-api-key",
      query: [
        { name: "symbols", required: true, example: "BTC,ETH,SOL", notes: "CSV list of assets." },
        { name: "fiat", required: false, example: "MXN", notes: "Optional fiat currency." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/market-health?symbols=BTC,ETH,SOL&fiat=MXN" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Executive market condition layer",
          example: `{"ok":true,"fiat":"MXN","ts":"...","source":"internal-analysis","marketHealth":{"state":"under_pressure","score":27,"summary":"The market is operating under pressure and requires additional attention."}}`,
        },
      ],
    },
  ],
} satisfies CryptoLinkDocsSchema;