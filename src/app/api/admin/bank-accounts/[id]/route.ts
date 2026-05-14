import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Activating an account deactivates all others
  if (body.active === true) {
    await prisma.bankAccount.updateMany({ data: { active: false } });
    await prisma.appConfig.update({ where: { key: "orders_since_rotation" }, data: { value: "0" } });
  }

  const account = await prisma.bankAccount.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ account });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.bankAccount.findUnique({ where: { id } });
  if (!account) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  if (account.active) return NextResponse.json({ error: "No puedes eliminar la cuenta activa" }, { status: 400 });

  await prisma.bankAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
