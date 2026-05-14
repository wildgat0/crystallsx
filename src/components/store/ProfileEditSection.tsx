"use client";

import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";

type Profile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

const EMPTY: Profile = { name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", country: "CL" };

export default function ProfileEditSection() {
  const [form, setForm] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setForm({
            name: d.profile.name ?? "",
            email: d.profile.email ?? "",
            phone: d.profile.phone ?? "",
            address: d.profile.address ?? "",
            city: d.profile.city ?? "",
            state: d.profile.state ?? "",
            zip: d.profile.zip ?? "",
            country: d.profile.country ?? "CL",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function set(field: keyof Profile, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Ocurrió un error al guardar. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-muted animate-pulse">Cargando información...</p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-cream-border rounded px-3 py-2.5 text-sm text-dark placeholder-muted bg-white focus:outline-none focus:border-dark transition-colors";
  const labelClass = "block text-[10px] tracking-[0.18em] text-dark/60 uppercase mb-1.5 font-medium";

  return (
    <form onSubmit={handleSave} className="bg-white">

        {/* Información de contacto */}
        <div className="p-6 border-b border-cream-border">
          <p className="text-[10px] tracking-[0.25em] text-dark/60 uppercase mb-5 font-semibold">
            Información de contacto
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre completo</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className={labelClass}>Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                disabled
                className={`${inputClass} bg-cream-light text-muted cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputClass}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>
        </div>

        {/* Dirección de envío */}
        <div className="p-6 border-b border-cream-border">
          <p className="text-[10px] tracking-[0.25em] text-dark/60 uppercase mb-5 font-semibold">
            Dirección de envío
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Dirección</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className={inputClass}
                placeholder="Calle y número"
              />
            </div>
            <div>
              <label className={labelClass}>Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={inputClass}
                placeholder="Santiago"
              />
            </div>
            <div>
              <label className={labelClass}>Región / Estado</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className={inputClass}
                placeholder="Región Metropolitana"
              />
            </div>
            <div>
              <label className={labelClass}>Código postal</label>
              <input
                type="text"
                value={form.zip}
                onChange={(e) => set("zip", e.target.value)}
                className={inputClass}
                placeholder="8320000"
              />
            </div>
            <div>
              <label className={labelClass}>País</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className={inputClass}
                placeholder="Chile"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-cream-light flex items-center justify-between gap-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {!error && saved && (
            <p className="text-xs text-green-700 flex items-center gap-1.5">
              <Check size={13} strokeWidth={2.5} /> Información guardada correctamente
            </p>
          )}
          {!error && !saved && <span />}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-dark text-white text-[11px] font-semibold tracking-widest px-6 py-2.5 hover:bg-dark-warm transition-colors disabled:opacity-60 rounded"
          >
            <Save size={14} strokeWidth={2} />
            {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
          </button>
        </div>
      </form>
  );
}
