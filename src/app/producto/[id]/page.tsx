export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/store/Header";
import ProductDetail from "@/components/store/ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id, active: true },
    include: {
      images: { orderBy: { order: "asc" } },
      variants: { where: { active: true }, orderBy: { createdAt: "asc" } },
      category: { include: { brand: true } },
    },
  });

  if (!product) notFound();

  return (
    <>
      <Header />
      <ProductDetail product={product} />
    </>
  );
}
