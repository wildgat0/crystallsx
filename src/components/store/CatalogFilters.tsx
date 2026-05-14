"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, ChevronDown, Search, X } from "lucide-react";

interface Category { id: string; name: string; }
interface Brand { id: string; name: string; categories: Category[]; }

function FilterDropdown({
  label,
  activeIds,
  items,
  onToggle,
  onClear,
}: {
  label: string;
  activeIds: string[];
  items: { id: string; name: string }[];
  onToggle: (id: string) => void;
  onClear: (e: React.MouseEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  const buttonLabel =
    activeIds.length === 0
      ? label
      : activeIds.length === 1
      ? (items.find((i) => i.id === activeIds[0])?.name ?? label)
      : `${activeIds.length} ${label.toLowerCase()}s`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
          activeIds.length > 0
            ? "border-dark bg-dark text-white"
            : "border-cream-border bg-white text-dark hover:border-dark/40"
        }`}
      >
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase">{buttonLabel}</span>
        {activeIds.length > 0 ? (
          <X size={13} onClick={onClear} className="hover:opacity-70" />
        ) : (
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-cream-border rounded-xl shadow-lg z-30 overflow-hidden">
          <div className="p-2 border-b border-cream-border">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Buscar ${label.toLowerCase()}...`}
                className="w-full pl-7 pr-7 py-1.5 text-xs border border-cream-border rounded-md bg-cream-light focus:outline-none focus:border-dark/30 placeholder:text-muted/60 text-dark"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-dark">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-muted text-center">Sin resultados</li>
            ) : (
              filtered.map((item) => {
                const isActive = activeIds.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onToggle(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors capitalize ${
                        isActive
                          ? "text-dark font-semibold bg-cream"
                          : "text-dark/70 hover:text-dark hover:bg-cream-light"
                      }`}
                    >
                      <span>{item.name}</span>
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? "border-dark bg-dark" : "border-dark/20"
                      }`}>
                        {isActive && <Check size={10} className="text-white" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {activeIds.length > 0 && (
            <div className="px-4 py-2.5 border-t border-cream-border flex items-center justify-between">
              <span className="text-xs text-muted">
                {activeIds.length} seleccionada{activeIds.length !== 1 ? "s" : ""}
              </span>
              <button onClick={onClear} className="text-xs text-dark underline underline-offset-2 hover:text-accent-dark transition-colors">
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CatalogFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const brandsParam = searchParams.get("brands") ?? "";
  const catsParam = searchParams.get("cats") ?? "";

  const activeBrandIds = brandsParam ? brandsParam.split(",").filter(Boolean) : [];
  const activeCatIds = catsParam ? catsParam.split(",").filter(Boolean) : [];

  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands ?? []));
  }, []);

  const allCatsRaw = brands.flatMap((b) => b.categories);

  // Build a map: lowercased name → all IDs sharing that name
  const catNameToIds = new Map<string, string[]>();
  allCatsRaw.forEach(({ id, name }) => {
    const k = name.toLowerCase();
    catNameToIds.set(k, [...(catNameToIds.get(k) ?? []), id]);
  });

  // Deduplicated list — one entry per unique name (first occurrence)
  const seenNames = new Set<string>();
  const allCategories = allCatsRaw.filter(({ name }) => {
    const k = name.toLowerCase();
    return seenNames.has(k) ? false : (seenNames.add(k), true);
  });

  // Active display IDs: the primary ID of each name group that has any ID active in the URL
  const activeCatIdsDisplay = allCategories
    .filter(({ name }) =>
      (catNameToIds.get(name.toLowerCase()) ?? []).some((id) => activeCatIds.includes(id))
    )
    .map(({ id }) => id);

  function navigate(nextBrandIds: string[], nextCatIds: string[]) {
    const params = new URLSearchParams();
    if (nextBrandIds.length > 0) params.set("brands", nextBrandIds.join(","));
    if (nextCatIds.length > 0) params.set("cats", nextCatIds.join(","));
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  function toggleBrand(id: string) {
    const next = activeBrandIds.includes(id)
      ? activeBrandIds.filter((b) => b !== id)
      : [...activeBrandIds, id];
    navigate(next, activeCatIds);
  }

  function toggleCat(id: string) {
    const cat = allCategories.find((c) => c.id === id);
    const groupIds = cat ? (catNameToIds.get(cat.name.toLowerCase()) ?? [id]) : [id];
    const isActive = groupIds.some((gid) => activeCatIds.includes(gid));
    const next = isActive
      ? activeCatIds.filter((c) => !groupIds.includes(c))
      : [...activeCatIds, ...groupIds.filter((gid) => !activeCatIds.includes(gid))];
    navigate(activeBrandIds, next);
  }

  function clearBrands(e: React.MouseEvent) {
    e.stopPropagation();
    navigate([], activeCatIds);
  }

  function clearCats(e: React.MouseEvent) {
    e.stopPropagation();
    navigate(activeBrandIds, []);
  }

  if (brands.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <FilterDropdown
        label="Marca"
        activeIds={activeBrandIds}
        items={brands}
        onToggle={toggleBrand}
        onClear={clearBrands}
      />
      <FilterDropdown
        label="Categoría"
        activeIds={activeCatIdsDisplay}
        items={allCategories}
        onToggle={toggleCat}
        onClear={clearCats}
      />
    </div>
  );
}
