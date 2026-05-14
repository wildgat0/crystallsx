"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { COLOR_HEX } from "@/lib/colors";

interface ProductImage {
  url: string;
  color?: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: { id: string; name: string; brand: { id: string; name: string } | null } | null;
  images: ProductImage[];
}

export default function ProductCard({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

  const images = product.images;

  const visibleImages = selectedColor
    ? images.filter((img) => img.color === selectedColor)
    : images;

  const activeImage = visibleImages[carouselIdx]?.url ?? images[0]?.url;
  const hasMultiple = visibleImages.length > 1;

  const uniqueColors = Array.from(
    new Set(images.filter((img) => img.color).map((img) => img.color as string))
  );

  function toggleColor(color: string) {
    setCarouselIdx(0);
    setSelectedColor((prev) => (prev === color ? null : color));
  }

  function prev(e: React.MouseEvent) {
    e.stopPropagation();
    setCarouselIdx((i) => (i - 1 + visibleImages.length) % visibleImages.length);
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation();
    setCarouselIdx((i) => (i + 1) % visibleImages.length);
  }

  return (
    <div className="h-full bg-white border border-cream-border rounded-xl overflow-hidden group flex flex-col">
      {/* Imagen / Carrusel */}
      <div className="relative aspect-[3/4] bg-[#f0ede8] overflow-hidden">
        {activeImage ? (
          <div key={activeImage} className="animate-carousel-fade absolute inset-0">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={36} className="text-[#d0cbc4]" />
          </div>
        )}

        {/* Overlay clickeable para navegar al detalle */}
        <Link
          href={`/producto/${product.id}`}
          className="absolute inset-0 z-10"
          aria-label={`Ver detalle de ${product.name}`}
        />

        {/* Flechas carrusel */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-opacity opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={15} className="text-dark" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-opacity opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={15} className="text-dark" />
            </button>
          </>
        )}

        {/* Dots de posición */}
        {hasMultiple && (
          <div className="absolute bottom-10 inset-x-0 flex justify-center gap-1 pointer-events-none z-20">
            {visibleImages.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === carouselIdx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}

        {/* Botón VER DETALLES — aparece al hacer hover */}
        <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
          <Link
            href={`/producto/${product.id}`}
            className="block w-full py-3 text-center text-[11px] font-bold tracking-widest bg-dark text-white hover:bg-dark-warm transition-colors duration-200"
          >
            VER DETALLES
          </Link>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 py-4 text-center flex flex-col flex-1">
        <p className="text-[12px] font-bold tracking-[0.2em] text-accent-dark uppercase mb-2">
          {product.category?.brand?.name ?? ""}
        </p>
        <Link href={`/producto/${product.id}`}>
          <h3 className="text-[18px] text-dark leading-snug mb-2 hover:text-accent-dark transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm font-medium text-dark mb-3">
          {fmt(product.price)}
        </p>

        {/* Círculos de color — filtro seleccionable/deseleccionable */}
        {uniqueColors.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-auto">
            {uniqueColors.map((color) => (
              <div key={color} className="relative group/swatch">
                <button
                  type="button"
                  onClick={() => toggleColor(color)}
                  title={color}
                  className={`w-5 h-5 rounded-full transition-all duration-150 ${
                    selectedColor === color
                      ? "border-2 border-dark scale-110 shadow"
                      : "border border-black/30 hover:scale-105 hover:border-black/60"
                  }`}
                  style={{ background: COLOR_HEX[color] ?? "#ccc" }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-dark text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover/swatch:opacity-100 transition-opacity">
                  {color}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
