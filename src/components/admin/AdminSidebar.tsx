"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, ShoppingBag, Landmark, Settings, LogOut, Package, Tag, Layers } from "lucide-react";

const LINKS = [
  { href: "/admin",               label: "Dashboard",         icon: LayoutDashboard, exact: true },
  { href: "/admin/orders",        label: "Órdenes",           icon: ShoppingBag },
  { href: "/admin/products",      label: "Productos",         icon: Package },
  { href: "/admin/brands",        label: "Marcas",            icon: Tag },
  { href: "/admin/categories",    label: "Categorías",        icon: Layers },
  { href: "/admin/bank-accounts", label: "Cuentas Bancarias", icon: Landmark },
  { href: "/admin/settings",      label: "Configuración",     icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-56 bg-dark min-h-screen flex flex-col flex-shrink-0">
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/admin">
          <span className="font-script text-2xl text-cream">Crystallsx</span>
        </Link>
        <p className="text-[10px] tracking-widest text-cream/30 mt-1 uppercase">Admin</p>
      </div>

      <nav className="flex-1 py-4">
        {LINKS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
              isActive(href, exact)
                ? "bg-white/10 text-cream font-semibold"
                : "text-cream/50 hover:text-cream hover:bg-white/5"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <Link href="/" className="flex items-center gap-2 text-xs text-cream/30 hover:text-cream/60 transition-colors mb-3">
          ← Ver tienda
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/cuenta/login" })}
          className="flex items-center gap-2 text-xs text-cream/30 hover:text-red-400 transition-colors w-full"
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
