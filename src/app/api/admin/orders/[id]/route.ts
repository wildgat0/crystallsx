import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleRotationAfterConfirm } from "@/lib/bank-rotation";
import { registerTracking } from "@/lib/trackingmore";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, bankAccount: true },
  });

  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, adminNote, trackingCode } = body as { status?: string; adminNote?: string; trackingCode?: string };

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (adminNote !== undefined) updateData.adminNote = adminNote;
  if (trackingCode !== undefined) updateData.trackingCode = trackingCode;
  if (status === "PAYMENT_CONFIRMED") updateData.confirmedAt = new Date();

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: { items: true, bankAccount: true },
  });

  if (status === "PAYMENT_CONFIRMED") {
    await handleRotationAfterConfirm();
  }

  if (status === "SHIPPED" && trackingCode) {
    await registerTracking(trackingCode).catch(() => null);
  }

  return NextResponse.json({ order: updated });
}
