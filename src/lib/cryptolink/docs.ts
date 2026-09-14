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

  version: "2.0.0",
  updatedAt: "2026-06-21",

  baseUrl:
    process.env.NEXT_PUBLIC_CRYPTOLINK_API_BASE?.replace(/\/+$/, "") ||
    "https://cryptolink-production.up.railway.app",

  auth: {
    header: "x-api-key",
    note: "Use your API key in the x-api-key header for production requests. Public examples are simplified for documentation purposes.",
  },

  limits: {
    maxSymbolsPlan: { FREE: 3, BUSINESS: 15, PRO: 25 },
    availableSymbolsToday: 60,
  },

  sections: [
    {
      id: "quickstart",
      title: "Quickstart",
      body: [
        "Base URL",
        "Authentication with x-api-key",
        "REST examples for direct market data and derived signals",
        "Default display currency is USD. Pass fiat to override.",
      ],
    },
    {
      id: "signals",
      title: "Signals",
      body: [
        "CryptoLink includes direct data, derived signals, and interpretive layers.",
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/price?symbol=BTC&fiat=USD" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "OK",
          example: `{"ts":".......","ok":true,"source":".....","marketCap":1583962661795.2954,"price":78852.0,"symbol":"BTC","change24h":1.9696273628936847,"fiat":"USD"}`,
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/prices?symbols=BTC,ETH&fiat=USD" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "OK",
          example: `{"marketCap":{"BTC":1584127244458.4119,"ETH":309104894066.60004},"change24h":{"BTC":1.982788636074705,"ETH":0.9509427550316462},"prices":{"BTC":78882.0,"ETH":2530.93},"ok":true,"source":"...","fiat":"USD","ts":"..."}`,
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/snapshot?symbols=BTC,ETH,SOL&fiat=USD" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "OK",
          example: `{"snapshot":{"source":"...","asOf":"...","prices":{"BTC":79003.0,"ETH":2533.94},"fiat":"USD","provider":"...","marketMood":"neutral"},"ok":true}`,
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/trends?symbols=BTC,ETH,SOL&fiat=USD" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Derived trend signals",
          example: `{"ok":true,"trends":[{"symbol":"BTC","direction":"up","changePct":0.26,"score":0.26,"last":79130.00,"source":"price-history-db"},{"symbol":"SOL","direction":"up","changePct":0.25,"score":0.25,"last":102.95,"source":"price-history-db"},{"symbol":"ETH","direction":"flat","changePct":0.19,"score":0.19,"last":2537.03,"source":"price-history-db"}],"source":"internal-history","ts":"...","fiat":"USD"}`,
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
        { name: "limit", required: false, example: "3", notes: "Maximum movers returned per side." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/movers?symbols=BTC,ETH,SOL&fiat=USD&limit=3" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Relative movers",
          example: `{"ok":true,"fiat":"USD","ts":"...","source":"internal-history","gainers":[],"losers":[]}`,
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/momentum?symbols=BTC,ETH,SOL&fiat=USD" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Momentum signal read",
          example: `{"ok":true,"momentum":[{"symbol":"SOL","direction":"up","changePct":0.56,"strength":"medium","score":0.37,"last":103.42,"source":"price-history-db"},{"symbol":"BTC","direction":"up","changePct":0.31,"strength":"low","score":0.15,"last":79127.00,"source":"price-history-db"},{"symbol":"ETH","direction":"up","changePct":0.19,"strength":"low","score":0.08,"last":2538.34,"source":"price-history-db"}],"source":"internal-history","ts":"...","fiat":"USD"}`,
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/regime?symbols=BTC,ETH,SOL&fiat=USD" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Aggregate market regime",
          example: `{"ok":true,"regime":{"ok":true,"regime":{"state":"bullish","score":1.40,"confidence":0.93,"summary":"A strong bullish lean with high confidence — 3 of 3 leaning up."},"source":"internal-analysis","ts":"...","fiat":"USD"}`,
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/risk-flags?symbols=BTC,ETH,SOL&fiat=USD" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Interpretive risk layer",
          example: `{"source":"internal-analysis","summary":"3 risk flags active, 1 at medium severity — worth a closer look.","ok":true,"fiat":"USD","flags":
          [{"code":"low_confidence_regime","severity":"medium","title":"Low regime confidence","detail":"The neutral regime reads at only 16% confidence, so directional signals are weakly supported."},
          {"code":"weak_momentum","severity":"low","title":"Weak momentum","detail":"All 3 tracked assets show low momentum strength — little conviction behind current moves."},
          {"code":"flat_market","severity":"low","title":"No clear direction","detail":"2 of 3 trend signals are flat — the group is holding without a clear direction."}],"ts":"..."}`,
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/anomalies?symbols=BTC,ETH,SOL&fiat=USD" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Anomaly detection layer",
          example: `{"source":"internal-analysis","summary":"1 signal drifting outside the recent pattern, none extreme.","anomalies":
          [{"symbol":"SOL","type":"momentum_spike","severity":"medium","score":2.38,"detail":
          "SOL is running clearly ahead of the group on momentum, about 2.38x the group average."}],"ok":true,"fiat":"USD","ts":"..."}`,
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
        { name: "fiat", required: false, example: "USD", notes: "Display currency. Default: USD." },
      ],
      examples: [
        {
          title: "curl",
          lang: "curl",
          code: `curl -s "https://cryptolink-production.up.railway.app/v1/market-health?symbols=BTC,ETH,SOL&fiat=USD" \\
  -H "x-api-key: TU_API_KEY"`,
        },
      ],
      responses: [
        {
          status: 200,
          description: "Executive market condition layer",
          example: `{"marketHealth":{"state":"healthy","score":94,"summary":"Conditions look healthy — driven by a bullish regime and 1 anomaly."},
          "ok":true,"source":"internal-analysis","ts":"....","fiat":"USD"}`,
        },
      ],
    },
  ],
} satisfies CryptoLinkDocsSchema;
