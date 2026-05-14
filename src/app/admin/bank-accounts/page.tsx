"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle, RefreshCw, Pencil, X, Check } from "lucide-react";
import toast from "react-hot-toast";

interface BankAccount {
  id: string; bankName: string; accountName: string; accountNumber: string;
  rut?: string; accountType: string; email?: string; instructions?: string;
  active: boolean; createdAt: string;
}

const EMPTY_FORM = {
  bankName: "", accountName: "", accountNumber: "",
  rut: "", accountType: "Corriente", email: "", instructions: "", setActive: false,
};

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [rotating, setRotating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  async function fetchAccounts() {
    const res = await fetch("/api/admin/bank-accounts");
    const data = await res.json();
    setAccounts(data.accounts);
    setLoading(false);
  }

  useEffect(() => { fetchAccounts(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target as HTMLInputElement;
    setForm((f) => ({ ...f, [target.name]: target.type === "checkbox" ? target.checked : target.value }));
  }

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(acc: BankAccount) {
    setEditing(acc);
    setForm({
      bankName: acc.bankName,
      accountName: acc.accountName,
      accountNumber: acc.accountNumber,
      rut: acc.rut ?? "",
      accountType: acc.accountType,
      email: acc.email ?? "",
      instructions: acc.instructions ?? "",
      setActive: acc.active,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editing) {
      const body: Record<string, unknown> = {
        bankName: form.bankName,
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        rut: form.rut || null,
        accountType: form.accountType,
        email: form.email || null,
        instructions: form.instructions || null,
      };
      if (form.setActive) body.active = true;

      const res = await fetch(`/api/admin/bank-accounts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Cuenta bancaria actualizada");
        closeForm();
        fetchAccounts();
      } else {
        const d = await res.json();
        toast.error(d.error || "Error al actualizar");
      }
    } else {
      const res = await fetch("/api/admin/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Cuenta bancaria agregada");
        closeForm();
        fetchAccounts();
      } else {
        const d = await res.json();
        toast.error(d.error || "Error al agregar cuenta");
      }
    }
  }

  async function activate(id: string) {
    await fetch(`/api/admin/bank-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true }),
    });
    toast.success("Cuenta activada");
    fetchAccounts();
  }

  async function deleteAccount(id: string) {
    if (!confirm("¿Eliminar esta cuenta bancaria?")) return;
    const res = await fetch(`/api/admin/bank-accounts/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Cuenta eliminada"); fetchAccounts(); }
    else { const d = await res.json(); toast.error(d.error || "Error"); }
  }

  async function manualRotate() {
    setRotating(true);
    const res = await fetch("/api/admin/rotate", { method: "POST" });
    const d = await res.json();
    if (res.ok) { toast.success(d.message); fetchAccounts(); }
    else toast.error(d.message || "Error al rotar");
    setRotating(false);
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Cargando...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Cuentas Bancarias</h1>
        <div className="flex gap-3">
          <button
            onClick={manualRotate}
            disabled={rotating}
            className="flex items-center gap-2 text-sm border border-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={14} className={rotating ? "animate-spin" : ""} />
            Rotar ahora
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 text-sm bg-dark text-white px-4 py-2 rounded hover:bg-dark-warm transition-colors"
          >
            <Plus size={14} /> Agregar cuenta
          </button>
        </div>
      </div>

      {/* Modal crear / editar */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? "Editar cuenta bancaria" : "Nueva cuenta bancaria"}
              </h2>
              <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Banco *" name="bankName" value={form.bankName} onChange={handleChange} required placeholder="Banco de Chile" />
              <Field label="Titular *" name="accountName" value={form.accountName} onChange={handleChange} required placeholder="Crystallsx SpA" />
              <Field label="Número de cuenta *" name="accountNumber" value={form.accountNumber} onChange={handleChange} required placeholder="00-000-00000-00" />
              <Field label="RUT" name="rut" value={form.rut} onChange={handleChange} placeholder="76.XXX.XXX-X" />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500">Tipo de cuenta</label>
                <select name="accountType" value={form.accountType} onChange={handleChange} className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent">
                  <option>Corriente</option>
                  <option>Vista</option>
                  <option>Ahorro</option>
                  <option>RUT</option>
                </select>
              </div>
              <Field label="Email para transferencias" name="email" value={form.email} onChange={handleChange} placeholder="pagos@crystallsx.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Instrucciones (opcional)</label>
              <textarea name="instructions" value={form.instructions} onChange={handleChange} rows={2} placeholder="Incluir número de pedido en el comentario..." className="border border-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="setActive" checked={form.setActive} onChange={handleChange} className="accent-accent-dark" />
              {editing ? "Marcar como cuenta activa" : "Activar esta cuenta inmediatamente"}
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="flex items-center gap-2 bg-dark text-white text-sm px-5 py-2 rounded hover:bg-dark-warm transition-colors">
                <Check size={14} /> {editing ? "Guardar cambios" : "Guardar cuenta"}
              </button>
              <button type="button" onClick={closeForm} className="text-sm text-gray-500 px-4 py-2 rounded border border-gray-200 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de cuentas */}
      <div className="space-y-3">
        {accounts.length === 0 && <p className="text-sm text-gray-400">No hay cuentas bancarias registradas.</p>}
        {accounts.map((acc) => (
          <div key={acc.id} className={`bg-white rounded-lg border p-4 flex items-start gap-4 ${acc.active ? "border-accent/60 bg-accent/5" : "border-gray-200"}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {acc.active && <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />}
                <p className="text-sm font-semibold text-gray-800">{acc.bankName}</p>
                {acc.active && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">ACTIVA</span>}
              </div>
              <p className="text-xs text-gray-500">{acc.accountName} — {acc.accountType}</p>
              <p className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded mt-1.5 inline-block">{acc.accountNumber}</p>
              {acc.rut && <p className="text-xs text-gray-400 mt-0.5">RUT: {acc.rut}</p>}
              {acc.email && <p className="text-xs text-gray-400">Email: {acc.email}</p>}
            </div>
            <div className="flex items-center gap-2">
              {!acc.active && (
                <button onClick={() => activate(acc.id)} className="flex items-center gap-1 text-xs text-green-700 border border-green-200 px-2.5 py-1.5 rounded hover:bg-green-50 transition-colors">
                  <CheckCircle size={12} /> Activar
                </button>
              )}
              <button
                onClick={() => openEdit(acc)}
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded"
                title="Editar"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => deleteAccount(acc.id)}
                disabled={acc.active}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={acc.active ? "No puedes eliminar la cuenta activa" : "Eliminar"}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, required, placeholder }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent" />
    </div>
  );
}
