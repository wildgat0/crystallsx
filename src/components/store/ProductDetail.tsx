"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check, ImageOff, ChevronLeft, ChevronRight,
  ArrowLeft, ShoppingBag, X, Pencil,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { COLOR_HEX } from "@/lib/colors";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProductEditModal from "@/components/admin/ProductEditModal";
import type { EditableProduct, CategoryObj } from "@/components/admin/ProductEditModal";

interface ProductImage {
  id: string;
  url: string;
  color?: string | null;
  variantName?: string | null;
  order: number;
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId?: string | null;
  category?: { id: string; name: string; brand: { id: string; name: string } | null } | null;
  images: ProductImage[];
  variants: ProductVariant[];
  active: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);

export default function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";

  const [added, setAdded] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryObj[]>([]);

  const activeVariants = product.variants ?? [];
  const hasVariants = activeVariants.length > 0;
  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) ?? null;
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;

  const images = product.images;
  const variantFilteredImages = selectedVariant
    ? images.filter((img) => !img.variantName || img.variantName === selectedVariant.name)
    : images;
  const visibleImages = selectedColor
    ? variantFilteredImages.filter((img) => img.color === selectedColor)
    : variantFilteredImages;
  const activeImage = visibleImages[carouselIdx]?.url ?? images[0]?.url;
  const hasMultiple = visibleImages.length > 1;

  const uniqueColors = Array.from(
    new Set(images.filter((img) => img.color).map((img) => img.color as string))
  );

  function toggleColor(color: string) {
    setCarouselIdx(0);
    setSelectedColor((prev) => (prev === color ? null : color));
  }

  function prev() {
    setCarouselIdx((i) => (i - 1 + visibleImages.length) % visibleImages.length);
  }
  function next() {
    setCarouselIdx((i) => (i + 1) % visibleImages.length);
  }

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      closeLightbox();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, visibleImages.length]);

  const needsColor = uniqueColors.length > 0 && !selectedColor;
  const needsVariant = hasVariants && !selectedVariantId;

  async function openEdit() {
    if (!categories.length) {
      const data = await fetch("/api/admin/categories").then(r => r.json());
      setCategories((data.categories ?? []).filter((c: { active: boolean }) => c.active));
    }
    setEditOpen(true);
  }

  function handleAdd() {
    if (needsColor) { toast.error("Selecciona un color primero"); return; }
    if (needsVariant) { toast.error("Selecciona una opción primero"); return; }

    add({
      id: selectedVariant ? selectedVariant.id : product.id,
      productId: product.id,
      name: product.name,
      price: displayPrice,
      brand: product.category?.brand?.name,
      category: product.category?.name ?? "",
      color: selectedColor ?? undefined,
      image: activeImage,
      variant: selectedVariant?.name,
    });
    setAdded(true);
    toast.success(`${product.name} agregado al carrito`);
    setTimeout(() => setAdded(false), 2500);
  }

  const ctaDisabled = needsColor || needsVariant;
  const ctaLabel = added
    ? "AGREGADO AL CARRITO"
    : needsVariant
    ? "SELECCIONA UNA OPCIÓN"
    : needsColor
    ? "SELECCIONA UN COLOR"
    : "AGREGAR AL CARRITO";

  return (
    <main className="min-h-screen bg-cream-light">
      {/* Breadcrumb */}
      <div className="border-b border-cream-border bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-muted tracking-wide">
            <Link href="/" className="hover:text-dark transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-accent-dark font-medium uppercase tracking-widest">{product.category?.name ?? ""}</span>
            <span>/</span>
            <span className="text-dark truncate max-w-[200px]">{product.name}</span>
          </div>
          {isAdmin && (
            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-dark transition-colors border border-gray-200 hover:border-dark rounded px-3 py-1.5"
            >
              <Pencil size={12} />
              Editar producto
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 lg:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[11px] tracking-widest text-muted hover:text-dark transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          VOLVER
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* ── Galería ── */}
          <div className="space-y-4">
            <div
              onClick={() => setLightboxOpen(true)}
              className="relative aspect-[3/4] bg-cream rounded-xl overflow-hidden cursor-zoom-in"
            >
              {activeImage ? (
                <div key={activeImage} className="animate-carousel-fade absolute inset-0">
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    className="object-contain pointer-events-none"
                    priority
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff size={48} className="text-cream-border" />
                </div>
              )}

              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 z-10"
                  >
                    <ChevronLeft size={18} className="text-dark" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 z-10"
                  >
                    <ChevronRight size={18} className="text-dark" />
                  </button>
                </>
              )}

              {hasMultiple && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10">
                  {visibleImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCarouselIdx(i); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === carouselIdx ? "bg-dark scale-125" : "bg-dark/30 hover:bg-dark/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {visibleImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {visibleImages.map((img, i) => (
                  <button
                    key={img.url + i}
                    type="button"
                    onClick={() => setCarouselIdx(i)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      i === carouselIdx
                        ? "border-dark shadow-md"
                        : "border-transparent hover:border-accent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      className="object-contain bg-cream"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="lg:sticky lg:top-24">
            <p className="text-[10px] font-bold tracking-[0.3em] text-accent-dark uppercase mb-3">
              {[product.category?.brand?.name, product.category?.name].filter(Boolean).join(" - ")}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-dark leading-tight mb-4">
              {product.name}
            </h1>
            <p className="text-2xl font-semibold text-dark mb-6">{fmt(displayPrice)}</p>

            <div className="h-px bg-cream-border mb-6" />

            {product.description && (
              <p className="text-sm text-muted leading-relaxed mb-8 whitespace-pre-line">
                {product.description}
              </p>
            )}

            {/* Selector de variantes */}
            {hasVariants && (
              <div className="mb-8">
                <p className="text-[10px] font-bold tracking-[0.2em] text-dark uppercase mb-3">
                  Opciones{selectedVariant ? `: ${selectedVariant.name}` : ""}
                </p>
                <div className="flex flex-col gap-2">
                  {activeVariants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantId((prev) => (prev === v.id ? null : v.id))}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-all ${
                        selectedVariantId === v.id
                          ? "border-dark bg-dark text-white font-medium"
                          : "border-cream-border bg-white text-dark hover:border-dark/40"
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className={`text-sm font-semibold ${selectedVariantId === v.id ? "text-white" : "text-dark"}`}>
                        {fmt(v.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de colores */}
            {uniqueColors.length > 0 && (
              <div className="mb-8">
                <p className="text-[10px] font-bold tracking-[0.2em] text-dark uppercase mb-3">
                  Color{selectedColor ? `: ${selectedColor}` : ""}
                </p>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map((color) => (
                    <div key={color} className="relative group/swatch">
                      <button
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={`w-8 h-8 rounded-full transition-all duration-150 ${
                          selectedColor === color
                            ? "border-2 border-dark scale-110 shadow-md"
                            : "border border-black/30 hover:scale-105 hover:border-black/60"
                        }`}
                        style={{ background: COLOR_HEX[color] ?? "#ccc" }}
                      />
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-dark text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover/swatch:opacity-100 transition-opacity">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              className={`w-full py-4 text-[12px] font-bold tracking-[0.25em] flex items-center justify-center gap-3 transition-all duration-200 rounded-sm ${
                added
                  ? "bg-accent-dark text-white"
                  : ctaDisabled
                  ? "bg-dark/50 text-white/60 cursor-not-allowed"
                  : "bg-dark text-white hover:bg-dark-warm"
              }`}
            >
              {added ? <Check size={15} /> : <ShoppingBag size={15} />}
              {ctaLabel}
            </button>

            <div className="mt-8 space-y-3 text-[11px] text-muted border-t border-cream-border pt-6">
              {[
                { icon: "✦", text: "Despacho a todo Chile — gratis sobre $150.000" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-2">
                  <span className="text-accent mt-0.5 shrink-0">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 bg-dark/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div
            className="relative w-full h-full max-w-4xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
          </div>

          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-white" />
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={22} className="text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight size={22} className="text-white" />
              </button>
            </>
          )}

          {hasMultiple && (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-widest">
              {carouselIdx + 1} / {visibleImages.length}
            </p>
          )}
        </div>
      )}

      {editOpen && (
        <ProductEditModal
          product={product as unknown as EditableProduct}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); router.refresh(); }}
        />
      )}
    </main>
  );
}
