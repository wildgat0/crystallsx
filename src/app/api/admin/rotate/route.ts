import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { manualRotate } from "@/lib/bank-rotation";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const result = await manualRotate();
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
