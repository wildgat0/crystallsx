import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { brand: true, _count: { select: { products: true } } },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      ...c,
      productCount: c._count.products,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, active } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const normalizedName = name.trim().toLowerCase();
  const brands = await prisma.brand.findMany({ select: { id: true } });

  if (brands.length === 0) {
    try {
      const category = await prisma.category.create({
        data: { name: normalizedName, active: active ?? true },
        include: { brand: true },
      });
      return NextResponse.json({ category }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
    }
  }

  await prisma.category.createMany({
    data: brands.map((b) => ({ name: normalizedName, brandId: b.id, active: active ?? true })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
