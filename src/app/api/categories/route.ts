import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categoryFilter = {
    active: true,
    products: { some: { active: true } },
  };

  const brands = await prisma.brand.findMany({
    where: { active: true, categories: { some: categoryFilter } },
    include: {
      categories: {
        where: categoryFilter,
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ brands });
}
