"use client";

import { useEffect, useState } from "react";
import { Save, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => { setSettings(d.settings); setLoading(false); });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rotation_threshold: settings.rotation_threshold,
        store_name: settings.store_name,
        store_email: settings.store_email,
        tax_rate: settings.tax_rate,
      }),
    });
    if (res.ok) toast.success("Configuración guardada");
    else toast.error("Error al guardar");
    setSaving(false);
  }

  function set(key: string, val: string) {
    setSettings((s) => ({ ...s, [key]: val }));
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Cargando...</div>;

  const threshold = parseInt(settings.rotation_threshold ?? "0");
  const since = parseInt(settings.orders_since_rotation ?? "0");

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">Configuración</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Store */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Información de la tienda</h2>
          <Field label="Nombre de la tienda" value={settings.store_name ?? ""} onChange={(v) => set("store_name", v)} />
          <Field label="Email de contacto" value={settings.store_email ?? ""} onChange={(v) => set("store_email", v)} type="email" />
          <Field
            label="Tasa de impuesto (IVA)"
            value={settings.tax_rate ?? "0.19"}
            onChange={(v) => set("tax_rate", v)}
            type="number"
            step="0.01"
            hint="0.19 = 19%"
          />
        </div>

        {/* Rotation */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Rotación de cuenta bancaria</h2>

          <Field
            label="Rotar cuenta cada N órdenes confirmadas"
            value={settings.rotation_threshold ?? "0"}
            onChange={(v) => set("rotation_threshold", v)}
            type="number"
            min="0"
            hint="0 = rotación desactivada (manual)"
          />

          {/* Progress */}
          <div className="bg-gray-50 rounded p-3">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Órdenes desde última rotación</span>
              <span className="font-semibold text-gray-700">{since} {threshold > 0 ? `/ ${threshold}` : ""}</span>
            </div>
            {threshold > 0 && (
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-dark rounded-full transition-all"
                  style={{ width: `${Math.min((since / threshold) * 100, 100)}%` }}
                />
              </div>
            )}
            {threshold === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Info size={12} />
                <span>Rotación automática desactivada. Usa &quot;Rotar ahora&quot; en Cuentas Bancarias.</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-dark text-white text-sm px-6 py-2.5 rounded hover:bg-dark-warm transition-colors disabled:opacity-60"
        >
          <Save size={14} />
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", hint, step, min }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; hint?: string; step?: string; min?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input
        type={type} value={value} step={step} min={min}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
