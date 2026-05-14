"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ClienteRegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/customers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al crear la cuenta.");
      setLoading(false);
      return;
    }

    await signIn("customer", { email: form.email, password: form.password, redirect: false });
    router.push("/cuenta");
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/logo-footer.png"
              alt="Crystallsx"
              width={320}
              height={120}
              className="h-20 w-auto object-contain mx-auto mb-4"
            />
          </Link>
          <p className="text-xs tracking-widest text-cream/40 uppercase">Mi Cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 space-y-5">
          <h1 className="font-serif text-xl font-medium text-dark text-center">Crear cuenta</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted tracking-wide">Nombre completo</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Tu nombre"
              className="w-full border border-cream-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted tracking-wide">Correo electrónico</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              placeholder="tu@correo.com"
              className="w-full border border-cream-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted tracking-wide">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-cream-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted tracking-wide">Confirmar contraseña</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              required
              placeholder="Repite tu contraseña"
              className="w-full border border-cream-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dark text-white py-3 rounded text-sm font-semibold tracking-widest hover:bg-dark-warm transition-colors disabled:opacity-60"
          >
            {loading ? "CREANDO CUENTA..." : "CREAR CUENTA"}
          </button>

          <p className="text-center text-xs text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/cuenta/login" className="text-dark font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
