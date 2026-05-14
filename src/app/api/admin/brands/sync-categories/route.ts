import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [brands, distinctNames] = await Promise.all([
    prisma.brand.findMany({ select: { id: true } }),
    prisma.category.groupBy({ by: ["name"] }),
  ]);

  if (brands.length === 0 || distinctNames.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  const existing = await prisma.category.findMany({ select: { name: true, brandId: true } });
  const existingSet = new Set(existing.map((p) => `${p.name}::${p.brandId}`));

  const toCreate: { name: string; brandId: string; active: boolean }[] = [];
  for (const brand of brands) {
    for (const { name } of distinctNames) {
      if (!existingSet.has(`${name}::${brand.id}`)) {
        toCreate.push({ name, brandId: brand.id, active: true });
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.category.createMany({ data: toCreate, skipDuplicates: true });
  }

  return NextResponse.json({ synced: toCreate.length });
}
