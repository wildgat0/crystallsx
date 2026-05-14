import { NextRequest, NextResponse } from "next/server";
import { getTracking } from "@/lib/trackingmore";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Falta el código" }, { status: 400 });

  const data = await getTracking(code);
  return NextResponse.json(data);
}
