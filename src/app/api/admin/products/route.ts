import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INCLUDE = {
  images: { orderBy: { order: "asc" as const } },
  variants: { orderBy: { createdAt: "asc" as const } },
  category: { include: { brand: true } },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: INCLUDE,
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, price, categoryId, images, active, variants } = body;

  if (!name || !description || !price) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: Number(price),
      categoryId: categoryId || null,
      active: active ?? true,
      images: {
        create: (images ?? []).map((img: { url: string; color?: string; variantName?: string }, i: number) => ({
          url: img.url, color: img.color || null, variantName: img.variantName || null, order: i,
        })),
      },
      variants: {
        create: (variants ?? [])
          .filter((v: { name: string; price: string }) => v.name.trim())
          .map((v: { name: string; price: string }) => ({
            name: v.name.trim(),
            price: Number(v.price),
            active: true,
          })),
      },
    },
    include: INCLUDE,
  });

  return NextResponse.json({ product }, { status: 201 });
}
