import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { categories: true } } },
  });
  return NextResponse.json({ brands });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, active } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  try {
    const brand = await prisma.brand.create({ data: { name: name.trim(), active: active ?? true } });

    const existingNames = await prisma.category.groupBy({ by: ["name"] });
    if (existingNames.length > 0) {
      await prisma.category.createMany({
        data: existingNames.map(({ name: catName }) => ({
          name: catName,
          brandId: brand.id,
          active: true,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ brand }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe una marca con ese nombre" }, { status: 409 });
  }
}
