import { NextResponse } from "next/server";
import { socialLinkBasicSignalsMock } from "@/lib/social/liveNarrative";

export async function GET() {
  return NextResponse.json(socialLinkBasicSignalsMock);
}