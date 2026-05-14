export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Header from "@/components/store/Header";
import ProductCard from "@/components/store/ProductCard";
import CatalogFilters from "@/components/store/CatalogFilters";
import Image from "next/image";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ brands?: string; cats?: string }> }) {
  const { brands: brandsParam, cats: catsParam } = await searchParams;
  const brandIds = brandsParam ? brandsParam.split(",").filter(Boolean) : [];
  const catIds = catsParam ? catsParam.split(",").filter(Boolean) : [];

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(catIds.length > 0 ? { categoryId: { in: catIds } } : {}),
      ...(brandIds.length > 0 ? { category: { brandId: { in: brandIds } } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { images: { orderBy: { order: "asc" } }, category: { include: { brand: true } } },
  });

  const activeFilterBrands = brandIds.length > 0
    ? await prisma.brand.findMany({ where: { id: { in: brandIds } } })
    : [];
  const activeFilterCats = catIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: catIds } } })
    : [];

  const hasFilter = activeFilterBrands.length > 0 || activeFilterCats.length > 0;
  const bestSellers = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    take: 4,
    include: { images: { orderBy: { order: "asc" } }, category: { include: { brand: true } } },
  });

  return (
    <>
      <Header />

      {/* ── HERO ── */}
      <section className="relative h-[60vh] min-h-[420px] flex flex-col items-center justify-center text-center bg-white overflow-hidden border-b border-cream-border">
        <div className="absolute w-[600px] h-[600px] rounded-full border border-dark/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-dark/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 px-6 max-w-3xl">
          <p className="animate-fade-in-up text-[10px] tracking-[0.35em] text-accent uppercase mb-6">
            SANTIAGO - CHILE
          </p>
          <h1 className="animate-fade-in-up [animation-delay:0.15s] font-serif text-6xl md:text-8xl font-medium text-dark leading-[0.95] mb-6">
            <em className="not-italic text-accent">Angelical</em> Clothing
          </h1>
          <p className="animate-fade-in-up [animation-delay:0.3s] text-sm text-muted tracking-[0.2em] mb-10">
            WORLDWIDE SHIPPING
          </p>
          <div className="animate-fade-in-up [animation-delay:0.45s] flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#all-products"
              className="inline-block bg-dark text-white text-[11px] font-semibold tracking-[0.2em] px-10 py-3.5 hover:bg-dark-warm transition-colors"
            >
              VER COLECCIÓN
            </a>
            <a
              href="#all-products"
              className="inline-block border border-dark/20 text-dark text-[11px] tracking-[0.2em] px-10 py-3.5 hover:bg-cream hover:border-dark/40 transition-all"
            >
              EXPLORAR
            </a>
          </div>
        </div>
      </section>

      {/* ── BARRA DE CONFIANZA ── */}
      <div className="animate-fade-in [animation-delay:0.55s] border-b border-cream-border bg-white">
        <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-cream-border text-center">
          {[
            { icon: "✦", label: "Moda de vanguardia",   sub: "Diseñada para destacar" },
            { icon: "✦", label: "Despacho a todo Chile", sub: "Envío gratis sobre $150.000" },
          ].map((item) => (
            <div key={item.label} className="py-4 sm:py-0 flex flex-col items-center gap-1">
              <span className="text-accent text-xs">{item.icon}</span>
              <p className="text-xs font-semibold tracking-widest text-dark uppercase">{item.label}</p>
              <p className="text-[11px] text-muted">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MÁS VENDIDOS ── */}
      <section className="animate-fade-in-up [animation-delay:0.3s] bg-cream py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] tracking-[0.25em] text-muted uppercase mb-1.5">Los más pedidos</p>
                <h2 className="font-serif text-3xl font-medium text-dark">Más Vendidos</h2>
              </div>
              <a
                href="#all-products"
                className="text-[11px] tracking-widest text-muted hover:text-dark underline underline-offset-4 transition-colors hidden sm:block"
              >
                VER TODO →
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {bestSellers.map((product, i) => (
                <div
                  key={product.id}
                  style={{ animationDelay: `${0.35 + i * 0.08}s` }}
                  className="animate-fade-in-up h-full"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* ── TODOS LOS PRODUCTOS ── */}
      <section id="all-products" className="animate-fade-in-up [animation-delay:0.4s] max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            {activeFilterCats.length > 0 ? (
              <>
                <p className="text-[10px] tracking-[0.25em] text-muted uppercase mb-1.5">Categoría</p>
                <h2 className="font-serif text-3xl font-medium text-dark capitalize">
                  {activeFilterCats.length === 1
                    ? activeFilterCats[0].name
                    : `${activeFilterCats.length} categorías`}
                </h2>
              </>
            ) : activeFilterBrands.length > 0 ? (
              <>
                <p className="text-[10px] tracking-[0.25em] text-muted uppercase mb-1.5">Marca</p>
                <h2 className="font-serif text-3xl font-medium text-dark">
                  {activeFilterBrands.length === 1
                    ? activeFilterBrands[0].name
                    : `${activeFilterBrands.length} marcas`}
                </h2>
              </>
            ) : (
              <>
                <p className="text-[10px] tracking-[0.25em] text-dark/60 uppercase mb-1.5">Catálogo completo</p>
                <h2 className="font-serif text-3xl font-medium text-dark">Todos los productos</h2>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted hidden sm:block">{products.length} producto{products.length !== 1 ? "s" : ""}</p>
            {hasFilter && (
              <a href="/" className="text-[11px] text-muted hover:text-dark underline underline-offset-2 transition-colors">
                × Limpiar filtros
              </a>
            )}
          </div>
        </div>

        <Suspense>
          <CatalogFilters />
        </Suspense>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <div
              key={product.id}
              style={{ animationDelay: `${0.45 + i * 0.05}s` }}
              className="animate-fade-in-up h-full"
            >
              <ProductCard product={product} />
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-muted">
              No hay productos en esta categoría.
            </div>
          )}
        </div>
      </section>

      {/* ── PIE DE PÁGINA ── */}
      <footer className="animate-fade-in [animation-delay:0.5s] bg-cream border-t border-cream-border text-dark/50 text-xs">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image src="/logo.png" alt="Crystallsx" width={120} height={36} className="h-8 w-auto object-contain" />
          <div className="flex gap-6">
            {["Tienda", "Categorías", "Envíos", "Privacidad", "Términos"].map((l) => (
              <a key={l} href="#" className="hover:text-dark transition-colors">{l}</a>
            ))}
          </div>
          <p>© Dev. José Leighton — Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}
