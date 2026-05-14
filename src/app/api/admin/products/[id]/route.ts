import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INCLUDE = {
  images: { orderBy: { order: "asc" as const } },
  variants: { orderBy: { createdAt: "asc" as const } },
  category: { include: { brand: true } },
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, price, categoryId, images, active, variants } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = Number(price);
  if (categoryId !== undefined) data.categoryId = categoryId || null;
  if (active !== undefined) data.active = active;

  if (images !== undefined) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    if (images.length > 0) {
      await prisma.productImage.createMany({
        data: (images as { url: string; color?: string; variantName?: string }[]).map((img, i) => ({
          url: img.url, color: img.color || null, variantName: img.variantName || null, order: i, productId: id,
        })),
      });
    }
  }

  if (variants !== undefined) {
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    const validVariants = (variants as { name: string; price: string | number }[])
      .filter((v) => v.name.trim());
    if (validVariants.length > 0) {
      await prisma.productVariant.createMany({
        data: validVariants.map((v) => ({
          name: v.name.trim(),
          price: Number(v.price),
          active: true,
          productId: id,
        })),
      });
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: INCLUDE,
  });
  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
