import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const configs = await prisma.appConfig.findMany();
  const settings = Object.fromEntries(configs.map((c) => [c.key, c.value]));
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json() as Record<string, string>;

  const updates = await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.appConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  return NextResponse.json({ updated: updates.length });
}
