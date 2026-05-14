"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import ProductEditModal from "@/components/admin/ProductEditModal";
import type { EditableProduct, CategoryObj } from "@/components/admin/ProductEditModal";

type Product = EditableProduct;

const PAGE_SIZE = 10;

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [page, setPage] = useState(1);

  async function fetchProducts() {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products);
    setLoading(false);
  }

  async function fetchCategories() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.categories) setCategories(data.categories.filter((c: { active: boolean }) => c.active));
  }

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  function openNew() { setEditing(null); setShowForm(true); }
  function openEdit(p: Product) { setEditing(p); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); }

  async function toggleActive(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    toast.success(p.active ? "Producto ocultado" : "Producto visible");
    fetchProducts();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Producto eliminado");
      setPage((p) => Math.min(p, Math.ceil((products.length - 1) / PAGE_SIZE) || 1));
      fetchProducts();
    } else toast.error("Error al eliminar");
    setDeleteTarget(null);
  }

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginated = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="p-6 text-sm text-gray-500">Cargando productos...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Productos</h1>
          <p className="text-xs text-gray-400 mt-0.5">{products.length} productos en total</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 text-sm bg-dark text-white px-4 py-2 rounded hover:bg-dark-warm transition-colors"
        >
          <Plus size={14} /> Nuevo producto
        </button>
      </div>

      {showForm && (
        <ProductEditModal
          product={editing}
          categories={categories}
          onClose={closeForm}
          onSaved={() => { closeForm(); fetchProducts(); }}
        />
      )}

      {/* Modal confirmar eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Eliminar producto</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ¿Estás seguro de que deseas eliminar <span className="font-medium text-gray-800">&quot;{deleteTarget.name}&quot;</span>? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-sm text-gray-500 px-4 py-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {products.length === 0 ? (
          <p className="text-sm text-gray-400 p-6">No hay productos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Marca</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                        {p.images[0] ? (
                          <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                        ) : (
                          <ImageOff size={16} className="text-gray-300" />
                        )}
                        {p.images.length > 1 && (
                          <span className="absolute bottom-0 right-0 bg-dark/70 text-white text-[8px] px-0.5 leading-3">+{p.images.length - 1}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 leading-tight">{p.name}</p>
                        {p.images.some(img => img.color) && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {[...new Set(p.images.map(img => img.color).filter(Boolean))].map((color) => (
                              <span key={color} className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                {color}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {p.category?.brand ? (
                      <span className="text-xs font-medium text-gray-700">{p.category.brand.name}</span>
                    ) : (
                      <span className="text-xs text-gray-300">Sin marca</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {p.category ? (
                      <span className="text-xs text-gray-500 capitalize">{p.category.name}</span>
                    ) : (
                      <span className="text-xs text-gray-300">Sin categoría</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800 whitespace-nowrap">
                    {fmt(p.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(p)}
                      title={p.active ? "Ocultar de la tienda" : "Mostrar en la tienda"}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        p.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {p.active ? <><Eye size={11} /> Visible</> : <><EyeOff size={11} /> Oculto</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, products.length)} de {products.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-7 h-7 text-xs rounded transition-colors ${
                    n === page ? "bg-dark text-white font-semibold" : "text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
