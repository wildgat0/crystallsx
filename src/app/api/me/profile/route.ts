import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, address: true, city: true, state: true, zip: true, country: true },
  });

  return NextResponse.json({ profile: customer });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, phone, address, city, state, zip, country } = await req.json();

  const customer = await prisma.customer.update({
    where: { id: session.user.id },
    data: { name, phone, address, city, state, zip, country },
    select: { name: true, phone: true, address: true, city: true, state: true, zip: true, country: true },
  });

  return NextResponse.json({ profile: customer });
}
