export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // ← reemplaza a `export const revalidate = 1800`

function getBaseUrl() {
  return process.env.CRYPTOLINK_API_BASE_URL || "http://localhost:8080";
}

export async function GET() {
  const key = process.env.CRYPTOLINK_DEMO_KEY;
  if (!key) {
    return Response.json({ ok: false, error: "missing config" }, { status: 500 });
  }

  const r = await fetch(`${getBaseUrl()}/v1/tokenized-yields`, {
    headers: { "x-api-key": key },
    next: { revalidate: 1800 },   // cache del upstream 30min (en runtime, no en build)
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" },
  });
}