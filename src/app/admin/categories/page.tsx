"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Layers } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  active: boolean;
  brandId: string | null;
  productCount: number;
}

interface UniqueCategory {
  sampleId: string;
  name: string;
  active: boolean;
  brandCount: number;
  productCount: number;
}

const EMPTY_FORM = { name: "", active: true };

function deduplicateCategories(categories: Category[], totalBrands: number): UniqueCategory[] {
  const map = new Map<string, UniqueCategory>();
  for (const c of categories) {
    const existing = map.get(c.name);
    if (existing) {
      existing.brandCount++;
      existing.productCount += c.productCount;
      if (!c.active) existing.active = false;
    } else {
      map.set(c.name, {
        sampleId: c.id,
        name: c.name,
        active: c.active,
        brandCount: 1,
        productCount: c.productCount,
      });
    }
  }
  // Include brandless categories (brandId null) without counting them as brand coverage
  return Array.from(map.values());
}

export default function CategoriesAdminPage() {
  const [rawCategories, setRawCategories] = useState<Category[]>([]);
  const [totalBrands, setTotalBrands] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UniqueCategory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<UniqueCategory | null>(null);

  async function fetchData() {
    const [catsRes, brandsRes] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/brands"),
    ]);
    const catsData = await catsRes.json();
    const brandsData = await brandsRes.json();
    setRawCategories(catsData.categories ?? []);
    setTotalBrands((brandsData.brands ?? []).length);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const categories = deduplicateCategories(rawCategories, totalBrands);

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(c: UniqueCategory) {
    setEditing(c);
    setForm({ name: c.name, active: c.active });
    setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }

    const url = editing ? `/api/admin/categories/${editing.sampleId}` : "/api/admin/categories";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(editing ? "Categoría actualizada" : "Categoría creada");
      closeForm();
      fetchData();
    } else {
      const d = await res.json();
      toast.error(d.error || "Error al guardar");
    }
  }

  async function toggleActive(c: UniqueCategory) {
    await fetch(`/api/admin/categories/${c.sampleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    fetchData();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/categories/${deleteTarget.sampleId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Categoría eliminada"); fetchData(); }
    else { const d = await res.json(); toast.error(d.error || "Error al eliminar"); }
    setDeleteTarget(null);
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Cargando categorías...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Categorías</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {categories.length} categoría{categories.length !== 1 ? "s" : ""} — se asignan automáticamente a todas las marcas
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 text-sm bg-dark text-white px-4 py-2 rounded hover:bg-dark-warm transition-colors"
        >
          <Plus size={14} /> Nueva categoría
        </button>
      </div>

      {/* Modal crear/editar */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? "Editar categoría" : "Nueva categoría"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Ej: ropa, calzado, accesorios..."
                  className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  autoFocus
                />
                <p className="text-[11px] text-gray-400">
                  El nombre se guardará en minúsculas y se asignará a todas las marcas.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="accent-accent-dark"
                />
                Categoría activa
              </label>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="flex items-center gap-2 bg-dark text-white text-sm px-5 py-2 rounded hover:bg-dark-warm transition-colors">
                  <Check size={14} /> {editing ? "Guardar cambios" : "Crear categoría"}
                </button>
                <button type="button" onClick={closeForm} className="text-sm text-gray-500 px-4 py-2 rounded border border-gray-200 hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={16} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Eliminar categoría</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ¿Estás seguro de que deseas eliminar{" "}
                  <span className="font-medium text-gray-800 capitalize">&quot;{deleteTarget.name}&quot;</span>?
                </p>
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  Se eliminará de las {deleteTarget.brandCount} marca{deleteTarget.brandCount !== 1 ? "s" : ""} que la tienen asignada.
                  {deleteTarget.productCount > 0 && ` Los ${deleteTarget.productCount} productos asociados quedarán sin categoría.`}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="text-sm text-gray-500 px-4 py-2 rounded border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <Layers size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No hay categorías registradas.</p>
            <button onClick={openNew} className="mt-3 text-sm text-accent-dark underline underline-offset-2">
              Crear la primera categoría
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.sampleId} className={`hover:bg-gray-50 transition-colors ${!c.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Layers size={12} className="text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-800 capitalize">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        c.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {c.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
