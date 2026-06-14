import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiKey =
      typeof body?.apiKey === "string"
        ? body.apiKey.trim()
        : "";

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing API key",
        },
        { status: 400 }
      );
    }

    const apiBaseUrl =
      process.env.CRYPTOLINK_API_BASE?.replace(/\/+$/, "");

    if (!apiBaseUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "CryptoLink API is not configured",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${apiBaseUrl}/v1/billing/portal`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
        }),
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data ?? {
          ok: false,
          error: "Billing portal request failed",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("cryptolink_portal_proxy_failed", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to open Billing Portal",
      },
      { status: 500 }
    );
  }
}