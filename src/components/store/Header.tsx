"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Menu, X, Search, User, LayoutDashboard, LogOut } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useSession, signOut } from "next-auth/react";
import CartSidebar from "./CartSidebar";
import CategoriesSidebar from "./CategoriesSidebar";

const NAV_LINKS = [
  { sectionId: "all-products", label: "Tienda" },
  { sectionId: "categories", label: "Categorías" },
];

export default function Header() {
  const { count, isOpen, openCart, closeCart } = useCart();
  const { data: session } = useSession();
  const [navOpen, setNavOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function scrollTo(sectionId: string, closeNav = false) {
    if (closeNav) setNavOpen(false);
    if (sectionId === "categories") {
      setCatOpen(true);
      return;
    }
    if (sectionId === "all-products") {
      if (pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/");
      }
      return;
    }
    if (pathname === "/") {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/#${sectionId}`);
    }
  }

  return (
    <>
      {/* Barra de anuncio */}
      <div className="bg-cream-dark text-dark text-center text-xs tracking-widest py-2 px-4">
        Envío gratis en pedidos sobre $150.000
      </div>

      <header className="sticky top-0 z-40 bg-white border-b border-cream-border">
        <div className="max-w-7xl mx-auto px-4 h-16 grid grid-cols-3 items-center">
          {/* Izquierda */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNavOpen(true)}
              className="p-2 rounded-full hover:bg-cream transition-colors lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu size={20} className="text-dark" />
            </button>
            <nav className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.label}
                  onClick={() => scrollTo(l.sectionId)}
                  className="text-sm text-dark hover:text-accent-dark transition-colors tracking-wide"
                >
                  {l.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Centro — Logo */}
          <Link href="/" className="flex justify-center">
            <Image src="/logo.png" alt="Crystallsx" width={200} height={60} className="h-14 w-auto object-contain" priority />
          </Link>

          {/* Derecha */}
          <div className="flex items-center gap-1 justify-end">
            <button className="p-2 rounded-full hover:bg-cream transition-colors" aria-label="Buscar">
              <Search size={18} className="text-dark" />
            </button>

            {session ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 p-2 rounded-full hover:bg-cream transition-colors"
                  aria-label="Mi cuenta"
                >
                  <User size={18} className="text-dark" />
                  <span className="text-xs text-dark font-medium hidden sm:block">
                    {session.user.name?.split(" ")[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-cream-border rounded-xl shadow-lg z-50 overflow-hidden py-1">
                    <Link
                      href="/cuenta"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark hover:bg-cream transition-colors"
                    >
                      <User size={14} className="text-muted shrink-0" />
                      Mi Cuenta
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark hover:bg-cream transition-colors"
                      >
                        <LayoutDashboard size={14} className="text-muted shrink-0" />
                        Módulo de Administración
                      </Link>
                    )}
                    <div className="border-t border-cream-border mt-1 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/cuenta/login" }); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark hover:bg-cream transition-colors"
                      >
                        <LogOut size={14} className="text-muted shrink-0" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/cuenta/login"
                className="p-2 rounded-full hover:bg-cream transition-colors"
                aria-label="Ingresar"
              >
                <User size={18} className="text-dark" />
              </Link>
            )}

            <button
              onClick={openCart}
              className="relative p-2 rounded-full hover:bg-cream transition-colors"
              aria-label="Carrito"
            >
              <ShoppingBag size={20} className="text-dark" />
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-dark text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-dark/50" onClick={() => setNavOpen(false)} />
          <nav className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-cream-border">
              <Image src="/logo.png" alt="Crystallsx" width={120} height={36} className="h-8 w-auto object-contain" />
              <button onClick={() => setNavOpen(false)} className="p-1 rounded-full hover:bg-cream">
                <X size={20} className="text-muted" />
              </button>
            </div>
            <ul className="flex-1 py-2">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <button
                    onClick={() => scrollTo(l.sectionId, true)}
                    className="w-full flex items-center justify-between px-6 py-3.5 text-sm text-dark border-b border-cream-dark/50 hover:bg-cream-light"
                  >
                    {l.label}
                    <span className="text-muted text-xs">›</span>
                  </button>
                </li>
              ))}
              <li>
                <Link
                  href={session ? "/cuenta" : "/cuenta/login"}
                  onClick={() => setNavOpen(false)}
                  className="flex items-center justify-between px-6 py-3.5 text-sm text-dark border-b border-cream-dark/50 hover:bg-cream-light"
                >
                  {session ? `Mi Cuenta (${session.user.name?.split(" ")[0]})` : "Ingresar"}
                  <span className="text-muted text-xs">›</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <CartSidebar isOpen={isOpen} onClose={closeCart} />
      <Suspense>
        <CategoriesSidebar isOpen={catOpen} onClose={() => setCatOpen(false)} />
      </Suspense>
    </>
  );
}
