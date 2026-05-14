"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ChevronRight } from "lucide-react";

interface CategoryItem { id: string; name: string; }
interface BrandWithCategories { id: string; name: string; categories: CategoryItem[]; }

interface Props { isOpen: boolean; onClose: () => void; }

export default function CategoriesSidebar({ isOpen, onClose }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCatId = searchParams.get("cats") ?? "";
  const activeBrandId = searchParams.get("brands") ?? "";

  const [brands, setBrands] = useState<BrandWithCategories[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && !loaded) {
      fetch("/api/categories")
        .then((r) => r.json())
        .then((d) => { setBrands(d.brands ?? []); setLoaded(true); });
    }
  }, [isOpen, loaded]);

  const totalCategories = brands.reduce((sum, b) => sum + b.categories.length, 0);

  function navigate(params: URLSearchParams) {
    onClose();
    const qs = params.toString();
    router.push(qs ? `/?${qs}#all-products` : "/");
  }

  function handleAll() {
    navigate(new URLSearchParams());
  }

  function handleBrand(brandId: string) {
    if (activeBrandId === brandId) {
      navigate(new URLSearchParams());
    } else {
      const p = new URLSearchParams();
      p.set("brands", brandId);
      navigate(p);
    }
  }

  function handleCategory(catId: string) {
    if (activeCatId === catId) {
      navigate(new URLSearchParams());
    } else {
      const p = new URLSearchParams();
      p.set("cats", catId);
      navigate(p);
    }
  }

  const hasFilter = activeCatId || activeBrandId;

  return (
    <>
      <div
        className={`fixed inset-0 bg-dark/40 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-border">
          <div>
            <h2 className="font-serif text-xl font-medium text-dark">Categorías</h2>
            <p className="text-xs text-muted mt-0.5">{totalCategories} colecciones</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream transition-colors" aria-label="Cerrar">
            <X size={18} className="text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!loaded ? (
            <div className="px-5 py-8 text-sm text-muted text-center">Cargando...</div>
          ) : brands.length === 0 ? (
            <div className="px-5 py-8 text-sm text-muted text-center">No hay categorías disponibles.</div>
          ) : (
            <ul className="py-2">
              {/* Ver todo */}
              <li>
                <button
                  onClick={handleAll}
                  className={`w-full flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-cream ${!hasFilter ? "text-dark font-semibold" : "text-muted"}`}
                >
                  <span>Todos los productos</span>
                  <ChevronRight size={14} className="text-muted" />
                </button>
              </li>

              {brands.map((brand) => {
                const brandActive = activeBrandId === brand.id;
                return (
                  <li key={brand.id}>
                    {/* Marca clicable */}
                    <button
                      onClick={() => handleBrand(brand.id)}
                      className={`w-full flex items-center justify-between px-5 pt-4 pb-1.5 transition-colors hover:text-accent-dark ${
                        brandActive ? "text-accent-dark" : ""
                      }`}
                    >
                      <p className="text-[10px] font-bold tracking-[0.2em] text-accent-dark uppercase">{brand.name}</p>
                      {brandActive && (
                        <span className="text-[10px] text-accent-dark font-medium">Activo ×</span>
                      )}
                    </button>
                    {/* Categorías de la marca */}
                    <ul>
                      {brand.categories.map((cat) => {
                        const catActive = activeCatId === cat.id;
                        return (
                          <li key={cat.id}>
                            <button
                              onClick={() => handleCategory(cat.id)}
                              className={`w-full flex items-center justify-between px-5 py-2.5 text-sm transition-colors hover:bg-cream ${
                                catActive ? "text-dark font-semibold bg-cream" : "text-dark/70"
                              }`}
                            >
                              <span className="capitalize">{cat.name}</span>
                              {catActive && (
                                <span className="text-[10px] text-accent-dark font-medium">Activo ×</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-4 border-t border-cream-border">
          <button
            onClick={onClose}
            className="block w-full text-center text-xs text-muted underline underline-offset-2"
          >
            Cerrar
          </button>
        </div>
      </aside>
    </>
  );
}
