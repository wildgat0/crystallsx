"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("customer", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (res?.error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    if (session?.user.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/cuenta");
    }
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
          <h1 className="font-serif text-xl font-medium text-dark text-center">Iniciar sesión</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
              {error}
            </div>
          )}

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
              placeholder="••••••••"
              className="w-full border border-cream-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dark text-white py-3 rounded text-sm font-semibold tracking-widest hover:bg-dark-warm transition-colors disabled:opacity-60"
          >
            {loading ? "INGRESANDO..." : "INGRESAR"}
          </button>

          <p className="text-center text-xs text-muted">
            ¿No tienes cuenta?{" "}
            <Link href="/cuenta/registro" className="text-dark font-semibold hover:underline">
              Crear cuenta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
