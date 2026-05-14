"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Tag, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const PAGE_SIZE = 12;

interface Brand {
  id: string;
  name: string;
  active: boolean;
  _count: { categories: number };
}

const EMPTY_FORM = { name: "", active: true };

export default function BrandsAdminPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [totalCategories, setTotalCategories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [page, setPage] = useState(1);

  async function fetchData() {
    const [brandsRes, catsRes] = await Promise.all([
      fetch("/api/admin/brands"),
      fetch("/api/admin/categories"),
    ]);
    const brandsData = await brandsRes.json();
    const catsData = await catsRes.json();

    setBrands(brandsData.brands ?? []);

    const names = new Set<string>();
    for (const c of catsData.categories ?? []) names.add(c.name);
    setTotalCategories(names.size);

    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/admin/brands/sync-categories", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.synced > 0 ? `${data.synced} categoría(s) sincronizada(s)` : "Todo ya estaba sincronizado");
      fetchData();
    } else {
      toast.error("Error al sincronizar");
    }
    setSyncing(false);
  }

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(b: Brand) { setEditing(b); setForm({ name: b.name, active: b.active }); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }

    const url = editing ? `/api/admin/brands/${editing.id}` : "/api/admin/brands";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });

    if (res.ok) {
      toast.success(editing ? "Marca actualizada" : "Marca creada");
      closeForm();
      if (!editing) setPage(1);
      fetchData();
    } else {
      const d = await res.json();
      toast.error(d.error || "Error al guardar");
    }
  }

  async function toggleActive(b: Brand) {
    await fetch(`/api/admin/brands/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !b.active }),
    });
    fetchData();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/brands/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Marca eliminada"); setPage((p) => Math.min(p, Math.ceil((brands.length - 1) / PAGE_SIZE) || 1)); fetchData(); }
    else { const d = await res.json(); toast.error(d.error || "Error al eliminar"); }
    setDeleteTarget(null);
  }

  const totalPages = Math.ceil(brands.length / PAGE_SIZE);
  const paginated = brands.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const outOfSync = brands.some((b) => b._count.categories < totalCategories);

  if (loading) return <div className="p-6 text-sm text-gray-500">Cargando marcas...</div>;

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Marcas</h1>
          <p className="text-xs text-gray-400 mt-0.5">{brands.length} marca{brands.length !== 1 ? "s" : ""} registrada{brands.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {outOfSync && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 text-sm border border-amber-300 text-amber-700 bg-amber-50 px-4 py-2 rounded hover:bg-amber-100 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sincronizando..." : "Sincronizar categorías"}
            </button>
          )}
          <button
            onClick={openNew}
            className="flex items-center gap-2 text-sm bg-dark text-white px-4 py-2 rounded hover:bg-dark-warm transition-colors"
          >
            <Plus size={14} /> Nueva marca
          </button>
        </div>
      </div>

      {/* Modal crear/editar */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? "Editar marca" : "Nueva marca"}
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
                  placeholder="Ej: Nike, Zara, Gucci..."
                  className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="accent-accent-dark"
                />
                Marca activa
              </label>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="flex items-center gap-2 bg-dark text-white text-sm px-5 py-2 rounded hover:bg-dark-warm transition-colors">
                  <Check size={14} /> {editing ? "Guardar cambios" : "Crear marca"}
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
                <h3 className="text-sm font-semibold text-gray-800">Eliminar marca</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ¿Estás seguro de que deseas eliminar{" "}
                  <span className="font-medium text-gray-800">&quot;{deleteTarget.name}&quot;</span>?
                </p>
                {deleteTarget._count.categories > 0 && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    Esta marca tiene {deleteTarget._count.categories} categoría(s) asociada(s). Al eliminarla, las categorías quedarán sin marca.
                  </p>
                )}
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
        {brands.length === 0 ? (
          <div className="p-12 text-center">
            <Tag size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No hay marcas registradas.</p>
            <button onClick={openNew} className="mt-3 text-sm text-accent-dark underline underline-offset-2">
              Crear la primera marca
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marca</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((b) => {
                return (
                  <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${!b.active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Tag size={12} className="text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-800">{b.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(b)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          b.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {b.active ? "Activa" : "Inactiva"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded" title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(b)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, brands.length)} de {brands.length}
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
