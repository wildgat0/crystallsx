"use client";

import Link from "next/link";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";

interface Props { isOpen: boolean; onClose: () => void; }

export default function CartSidebar({ isOpen, onClose }: Props) {
  const { items, subtotal, remove, updateQty } = useCart();

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-dark/40 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-border">
          <div>
            <h2 className="font-serif text-xl font-medium text-dark">Tu carrito</h2>
            {items.length > 0 && (
              <p className="text-xs text-muted mt-0.5">{items.reduce((s, i) => s + i.qty, 0)} artículo(s)</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream transition-colors" aria-label="Cerrar">
            <X size={18} className="text-muted" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto cart-body px-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-10">
              <ShoppingBag size={48} className="text-cream-border" />
              <p className="text-muted text-sm">Tu carrito está vacío</p>
              <button onClick={onClose} className="text-xs text-accent-dark underline underline-offset-2">
                Explorar productos
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-cream-border">
              {items.map((item) => (
                <li key={item.id} className="py-4 flex gap-3">
                  <div className="w-16 h-16 bg-cream rounded overflow-hidden flex-shrink-0 border border-cream-border relative">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-lg font-serif text-muted">{item.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark leading-tight truncate">{item.name}</p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {[item.brand, item.category, item.color].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-sm font-bold text-dark mt-1">{fmt(item.price * item.qty)}</p>
                    <div className="flex items-center gap-0 mt-2 border border-cream-border rounded w-fit">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-cream transition-colors text-muted"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold border-x border-cream-border leading-7">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-cream transition-colors text-muted"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="text-muted hover:text-red-500 transition-colors self-start pt-0.5"
                    aria-label="Eliminar"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 pb-6 pt-4 border-t border-cream-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs tracking-widest text-muted uppercase">Subtotal</span>
              <span className="text-lg font-bold text-dark">{fmt(subtotal)}</span>
            </div>
            <p className="text-xs text-muted text-center">Envío calculado al finalizar la compra</p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full bg-dark text-white text-center py-3.5 rounded text-sm font-semibold tracking-widest hover:bg-dark-warm transition-colors"
            >
              FINALIZAR COMPRA →
            </Link>
            <button
              onClick={onClose}
              className="block w-full text-center text-xs text-muted underline underline-offset-2"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
