import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const account = await prisma.bankAccount.findFirst({ where: { active: true } });
  return NextResponse.json({ account });
}
