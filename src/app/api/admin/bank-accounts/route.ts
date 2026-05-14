import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const accounts = await prisma.bankAccount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { bankName, accountName, accountNumber, rut, accountType, email, instructions, setActive } = body;

  if (!bankName || !accountName || !accountNumber) {
    return NextResponse.json({ error: "Banco, titular y número de cuenta son requeridos" }, { status: 400 });
  }

  // If new account should be active, deactivate all others first
  if (setActive) {
    await prisma.bankAccount.updateMany({ data: { active: false } });
  }

  const account = await prisma.bankAccount.create({
    data: { bankName, accountName, accountNumber, rut, accountType, email, instructions, active: !!setActive },
  });

  return NextResponse.json({ account }, { status: 201 });
}
