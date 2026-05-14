"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, Upload, ImageOff, Library, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { COLOR_HEX } from "@/lib/colors";

const COLORS = [
  "Negro", "Blanco", "Gris", "Gris oscuro", "Beige", "Crema", "Café", "Marrón",
  "Rojo", "Burdeos", "Azul", "Azul marino", "Celeste", "Verde", "Verde militar",
  "Amarillo", "Naranja", "Rosa", "Fucsia", "Morado", "Lila", "Dorado", "Plateado",
];

interface FormImage { url: string; color: string; variantName: string; }
interface FormVariant { name: string; price: string; }

export interface ProductImage {
  id: string;
  url: string;
  color: string | null;
  variantName: string | null;
  order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export interface Brand { id: string; name: string; }

export interface CategoryObj {
  id: string;
  name: string;
  brandId: string | null;
  brand: Brand | null;
}

export interface EditableProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string | null;
  category: CategoryObj | null;
  images: ProductImage[];
  variants: ProductVariant[];
  active: boolean;
}

interface Props {
  product: EditableProduct | null;
  categories?: CategoryObj[];
  onClose: () => void;
  onSaved: (product: EditableProduct) => void;
}

export default function ProductEditModal({ product, categories, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    categoryId: product?.categoryId ?? "",
    active: product?.active ?? true,
    images: (product?.images ?? []).map((img) => ({ url: img.url, color: img.color ?? "", variantName: img.variantName ?? "" })) as FormImage[],
  });
  const [variants, setVariants] = useState<FormVariant[]>(
    (product?.variants ?? []).map((v) => ({ name: v.name, price: String(v.price) }))
  );
  const [selectedBrandId, setSelectedBrandId] = useState(product?.category?.brandId ?? "");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryObj[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ url: string; key: string }[]>([]);
  const [galleryFolders, setGalleryFolders] = useState<{ prefix: string }[]>([]);
  const [galleryPrefix, setGalleryPrefix] = useState("");
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySelected, setGallerySelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([brandsData, catsData]) => {
      setBrands(brandsData.brands ?? []);
      setAllCategories(catsData.categories ?? []);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, []);

  const filteredCategories = selectedBrandId
    ? allCategories.filter((c) => c.brandId === selectedBrandId)
    : allCategories;

  function handleBrandChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedBrandId(e.target.value);
    setForm((f) => ({ ...f, categoryId: "" }));
  }

  async function loadGallery(prefix: string) {
    setGalleryLoading(true);
    setGalleryPrefix(prefix);
    try {
      const res = await fetch(`/api/admin/s3-images?prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      setGalleryFolders(data.folders ?? []);
      setGalleryImages(data.images ?? []);
    } catch {
      toast.error("Error al cargar la galería");
    } finally {
      setGalleryLoading(false);
    }
  }

  async function openGallery() {
    setShowGallery(true);
    setGallerySelected(new Set());
    await loadGallery("");
  }

  async function navigateFolder(prefix: string) {
    setGallerySelected(new Set());
    await loadGallery(prefix);
  }

  function toggleGalleryImage(url: string) {
    setGallerySelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function confirmGallerySelection() {
    const newImages: FormImage[] = [...gallerySelected].map((url) => ({ url, color: "", variantName: "" }));
    setForm((f) => ({ ...f, images: [...f.images, ...newImages] }));
    setGallerySelected(new Set());
    setShowGallery(false);
    toast.success(`${newImages.length} imagen(es) seleccionada(s)`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement;
    setForm((f) => ({ ...f, [target.name]: target.type === "checkbox" ? target.checked : target.value }));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const uploaded: FormImage[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        uploaded.push({ url, color: "", variantName: "" });
      } else {
        toast.error(`Error al subir ${file.name}`);
      }
    }
    if (uploaded.length) setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function updateImageColor(idx: number, color: string) {
    setForm((f) => ({
      ...f,
      images: f.images.map((img, i) => (i === idx ? { ...img, color } : img)),
    }));
  }

  function updateImageVariant(idx: number, variantName: string) {
    setForm((f) => ({
      ...f,
      images: f.images.map((img, i) => (i === idx ? { ...img, variantName } : img)),
    }));
  }

  function addVariant() {
    setVariants((v) => [...v, { name: "", price: "" }]);
  }

  function removeVariant(idx: number) {
    setVariants((v) => v.filter((_, i) => i !== idx));
  }

  function updateVariant(idx: number, field: keyof FormVariant, value: string) {
    setVariants((v) => v.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validVariants = variants.filter((v) => v.name.trim());
    for (const v of validVariants) {
      if (!v.price || isNaN(Number(v.price)) || Number(v.price) <= 0) {
        toast.error(`La variante "${v.name}" necesita un precio válido`);
        return;
      }
    }

    const body = { ...form, price: Number(form.price), variants: validVariants };
    const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
    const method = product ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      toast.success(product ? "Producto actualizado" : "Producto creado");
      onSaved(data.product);
    } else {
      const d = await res.json();
      toast.error(d.error || "Error al guardar");
    }
  }

  const fmt = (n: string) => {
    const num = Number(n);
    if (!n || isNaN(num)) return "";
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(num);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {product ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre *" name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Chaqueta Oversize" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Marca</label>
              <select
                value={selectedBrandId}
                onChange={handleBrandChange}
                disabled={loadingData}
                className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent disabled:opacity-60"
              >
                <option value="">{loadingData ? "Cargando..." : "— Sin marca —"}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <Field label="Precio base (CLP) *" name="price" value={form.price} onChange={handleChange} required placeholder="89000" type="number" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Categoría</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                disabled={loadingData}
                className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent disabled:opacity-60"
              >
                <option value="">{loadingData ? "Cargando..." : "— Sin categoría —"}</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {!selectedBrandId && c.brand ? `${c.brand.name} › ` : ""}
                    {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Descripción *</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              required rows={3} placeholder="Descripción del producto..."
              className="border border-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
            />
          </div>

          {/* Variantes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500">
                Variantes
                <span className="ml-1.5 font-normal text-gray-400">(opcional — ej: Con tobillera, Sin tobillera)</span>
              </label>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 text-xs text-accent-dark border border-accent/30 px-2.5 py-1 rounded hover:bg-accent/5 transition-colors"
              >
                <Plus size={11} /> Agregar
              </button>
            </div>

            {variants.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_140px_32px] gap-0 text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <span>Nombre de la variante</span>
                  <span>Precio (CLP)</span>
                  <span />
                </div>
                {variants.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_140px_32px] gap-2 items-center px-3 py-2 border-b border-gray-100 last:border-0">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => updateVariant(idx, "name", e.target.value)}
                      placeholder="Ej: Con tobillera"
                      className="border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent"
                    />
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => updateVariant(idx, "price", e.target.value)}
                        placeholder="320000"
                        className="border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-accent"
                      />
                      {v.price && !isNaN(Number(v.price)) && (
                        <span className="text-[10px] text-gray-400 pl-0.5">{fmt(v.price)}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {variants.length > 0 && (
              <p className="text-[11px] text-amber-600">
                Cuando hay variantes, el cliente deberá seleccionar una antes de agregar al carrito.
              </p>
            )}
          </div>

          {/* Fotos */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500">
              Fotos y colores
              {form.images.length > 0 && (
                <span className="ml-1.5 font-normal text-gray-400">({form.images.length} foto{form.images.length !== 1 ? "s" : ""})</span>
              )}
            </label>

            <div className="flex flex-wrap gap-3 items-start">
              {form.images.map((img, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 flex-shrink-0">
                  <div className="relative w-20 h-24 rounded border border-gray-200 overflow-hidden bg-gray-50 group">
                    <Image src={img.url} alt={`Foto ${idx + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-white/90 border border-gray-200 rounded-full p-0.5 text-gray-500 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={11} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-dark/70 text-white py-0.5">Principal</span>
                    )}
                  </div>
                  <ColorSelect value={img.color} onChange={(c) => updateImageColor(idx, c)} />
                  {variants.some((v) => v.name.trim()) && (
                    <VariantSelect
                      value={img.variantName}
                      variants={variants}
                      onChange={(v) => updateImageVariant(idx, v)}
                    />
                  )}
                </div>
              ))}

              <div className="flex flex-col gap-2 self-start mt-1">
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-sm border border-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  <Upload size={14} />
                  {uploading ? "Subiendo..." : "Subir fotos"}
                </button>
                <button
                  type="button"
                  onClick={openGallery}
                  className="flex items-center gap-2 text-sm border border-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <Library size={14} />
                  Elegir de galería
                </button>
              </div>
            </div>

            {form.images.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-400 border border-dashed border-gray-200 rounded px-3 py-4 w-fit">
                <ImageOff size={14} />
                Sin fotos — la primera foto será la principal
              </div>
            )}
            <p className="text-[11px] text-gray-400">La primera foto es la que se muestra por defecto.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="accent-accent-dark" />
            Visible en la tienda
          </label>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="flex items-center gap-2 bg-dark text-white text-sm px-5 py-2 rounded hover:bg-dark-warm transition-colors">
              <Check size={14} /> {product ? "Guardar cambios" : "Crear producto"}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-gray-500 px-4 py-2 rounded border border-gray-200 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* S3 Gallery Modal */}
    {showGallery && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={() => setShowGallery(false)} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-gray-800">Galería de imágenes (S3)</h3>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
                <button type="button" onClick={() => navigateFolder("")} className="hover:text-gray-700 transition-colors">
                  Bucket
                </button>
                {galleryPrefix.split("/").filter(Boolean).map((segment, i, arr) => {
                  const prefix = arr.slice(0, i + 1).join("/") + "/";
                  return (
                    <span key={prefix} className="flex items-center gap-1">
                      <span>/</span>
                      <button
                        type="button"
                        onClick={() => navigateFolder(prefix)}
                        className={`hover:text-gray-700 transition-colors ${i === arr.length - 1 ? "text-gray-700 font-medium" : ""}`}
                      >
                        {segment}
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <button type="button" onClick={() => setShowGallery(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {galleryLoading ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">Cargando...</div>
            ) : galleryFolders.length === 0 && galleryImages.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">Carpeta vacía</div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Folders */}
                {galleryFolders.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {galleryFolders.map((f) => {
                      const name = f.prefix.replace(galleryPrefix, "").replace("/", "");
                      return (
                        <button
                          key={f.prefix}
                          type="button"
                          onClick={() => navigateFolder(f.prefix)}
                          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        >
                          <span>📁</span>
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* Images */}
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {galleryImages.map((img) => {
                      const selected = gallerySelected.has(img.url);
                      return (
                        <button
                          key={img.key}
                          type="button"
                          onClick={() => toggleGalleryImage(img.url)}
                          className={`relative aspect-square rounded border-2 overflow-hidden transition-all ${
                            selected ? "border-accent-dark ring-1 ring-accent-dark" : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <Image src={img.url} alt="" fill className="object-cover" />
                          {selected && (
                            <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                              <Check size={20} className="text-accent-dark drop-shadow" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              {gallerySelected.size > 0 ? `${gallerySelected.size} seleccionada(s)` : "Clic para seleccionar"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowGallery(false)}
                className="text-sm text-gray-500 px-4 py-2 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmGallerySelection}
                disabled={gallerySelected.size === 0}
                className="text-sm bg-dark text-white px-4 py-2 rounded hover:bg-dark-warm disabled:opacity-50 transition-colors"
              >
                Agregar ({gallerySelected.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function ColorSelect({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative w-20" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 border border-gray-200 rounded px-1.5 py-1 text-[11px] hover:border-gray-400 transition-colors bg-white"
      >
        {value ? (
          <>
            <span className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" style={{ background: COLOR_HEX[value] ?? "#ccc" }} />
            <span className="truncate text-gray-700">{value}</span>
          </>
        ) : (
          <span className="text-gray-400">— Color</span>
        )}
      </button>
      {open && (
        <ul className="absolute top-full mt-1 left-0 w-40 bg-white border border-gray-200 rounded shadow-lg z-20 max-h-52 overflow-y-auto">
          <li>
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-2.5 py-1.5 text-[11px] text-gray-400 hover:bg-gray-50">
              — Sin color
            </button>
          </li>
          {COLORS.map((c) => (
            <li key={c}>
              <button type="button" onClick={() => { onChange(c); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] transition-colors ${value === c ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"}`}>
                <span className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" style={{ background: COLOR_HEX[c] }} />
                <span className="text-gray-700">{c}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VariantSelect({ value, variants, onChange }: {
  value: string;
  variants: FormVariant[];
  onChange: (v: string) => void;
}) {
  const options = variants.filter((v) => v.name.trim());
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-20 border border-gray-200 rounded px-1.5 py-1 text-[11px] bg-white focus:outline-none text-gray-700"
    >
      <option value="">— Variante</option>
      {options.map((v, i) => (
        <option key={i} value={v.name}>{v.name}</option>
      ))}
    </select>
  );
}

function Field({ label, name, value, onChange, required, placeholder, type = "text" }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
    </div>
  );
}
