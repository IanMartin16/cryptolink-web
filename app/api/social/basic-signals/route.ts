import { NextResponse } from "next/server";
import { socialLinkBasicSignalsMock } from "@/lib/social/basicSignalsMock";

export async function GET() {
  return NextResponse.json(socialLinkBasicSignalsMock);
}