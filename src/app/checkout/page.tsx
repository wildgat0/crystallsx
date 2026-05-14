"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart-context";
import Header from "@/components/store/Header";
import { Lock, ChevronRight, Save, Paperclip, X, FileCheck } from "lucide-react";
import toast from "react-hot-toast";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purchaseType, setPurchaseType] = useState<"" | "nacional" | "internacional">("");
  const [paymentMode, setPaymentMode] = useState<"" | "completa" | "abono70">("");
  const [bankAccount, setBankAccount] = useState<{
    bankName: string; accountName: string; accountNumber: string;
    rut?: string | null; accountType: string; email?: string | null; instructions?: string | null;
  } | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const tax = Math.round(subtotal * 0.19);
  const total = subtotal + tax;

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    address: "", city: "", state: "", zip: "", country: "CL",
  });

  const requiresReceipt = purchaseType === "nacional" && !!paymentMode;
  const isFormComplete =
    !!form.name.trim() &&
    !!form.email.trim() &&
    !!form.address.trim() &&
    !!form.city.trim() &&
    !!form.zip.trim() &&
    !!purchaseType &&
    (purchaseType === "internacional" || !!paymentMode) &&
    (!requiresReceipt || !!receiptFile);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then((d) => {
        if (!d.profile) return;
        const p = d.profile;
        setForm((f) => ({
          name:    p.name    || f.name,
          email:   p.email   || f.email,
          phone:   p.phone   || f.phone,
          address: p.address || f.address,
          city:    p.city    || f.city,
          state:   p.state   || f.state,
          zip:     p.zip     || f.zip,
          country: p.country || f.country,
        }));
      });
  }, [session?.user?.id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, phone: form.phone,
          address: form.address, city: form.city,
          state: form.state, zip: form.zip, country: form.country,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Información guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function handlePurchaseType(type: "nacional" | "internacional") {
    setPurchaseType(type);
    setPaymentMode("");
    if (!bankAccount) {
      fetch("/api/bank-account")
        .then((r) => r.json())
        .then((d) => setBankAccount(d.account ?? null));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) { toast.error("Tu carrito está vacío"); return; }
    if (!purchaseType) { toast.error("Selecciona el tipo de compra"); return; }
    if (purchaseType === "nacional" && !paymentMode) { toast.error("Selecciona la modalidad de pago"); return; }

    const paymentType = purchaseType === "internacional" ? "internacional" : `nacional_${paymentMode}`;

    setLoading(true);
    try {
      // Upload receipt if provided
      let receiptUrl: string | undefined;
      if (receiptFile) {
        const fd = new FormData();
        fd.append("file", receiptFile);
        const up = await fetch("/api/upload/receipt", { method: "POST", body: fd });
        const upData = await up.json();
        if (!up.ok) throw new Error(upData.error || "Error al subir el comprobante");
        receiptUrl = upData.url;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone },
          address: { address: form.address, city: form.city, state: form.state, zip: form.zip, country: form.country },
          items: items.map((i) => ({ id: i.productId, qty: i.qty })),
          paymentType,
          receiptUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear orden");

      clear();
      router.push(`/order/${data.order.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al procesar el pedido");
      setLoading(false);
    }
  }

  if (!items.length) {
    return (
      <>
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="text-muted">Tu carrito está vacío.</p>
          <Link href="/" className="text-sm underline underline-offset-2 text-accent-dark">Volver a la tienda</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted mb-8">
          <Link href="/" className="hover:text-dark">Tienda</Link>
          <ChevronRight size={12} />
          <Link href="/cart" className="hover:text-dark">Carrito</Link>
          <ChevronRight size={12} />
          <span className="text-dark">Checkout</span>
        </nav>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6 items-start">

            {/* Col 1: Contact + Shipping */}
            <div className="space-y-4">
              {/* Contact */}
              <div className="bg-white border border-cream-border rounded overflow-hidden">
                <div className="bg-cream-light px-5 py-3.5 border-b border-cream-border">
                  <h2 className="text-xs font-bold tracking-widest text-muted uppercase">Información de contacto</h2>
                </div>
                <div className="p-5 grid gap-4">
                  <Input label="Nombre completo" name="name" value={form.name} onChange={handleChange} required placeholder="Juan Pérez" />
                  <div className="grid gap-4">
                    <Input label="Correo electrónico" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="tu@email.com" />
                    <Input label="Teléfono" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+56 9 1234 5678" />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white border border-cream-border rounded overflow-hidden">
                <div className="bg-cream-light px-5 py-3.5 border-b border-cream-border">
                  <h2 className="text-xs font-bold tracking-widest text-muted uppercase">Dirección de envío</h2>
                </div>
                <div className="p-5 grid gap-4">
                  <Input label="Dirección" name="address" value={form.address} onChange={handleChange} required placeholder="Av. Ejemplo 1234" />
                  <div className="grid gap-4">
                    <Input label="Ciudad" name="city" value={form.city} onChange={handleChange} required placeholder="Santiago" />
                    <Input label="Código postal" name="zip" value={form.zip} onChange={handleChange} required placeholder="8320000" />
                  </div>
                  <div className="grid gap-4">
                    <Input label="Región" name="state" value={form.state} onChange={handleChange} placeholder="Metropolitana" />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-dark/70 tracking-wide">País</label>
                      <select name="country" value={form.country} onChange={handleChange} className="border border-cream-border rounded px-3 py-2.5 text-sm text-dark bg-white focus:outline-none focus:border-accent">
                        <option value="CL">Chile</option>
                        <option value="MX">México</option>
                        <option value="AR">Argentina</option>
                        <option value="PE">Perú</option>
                        <option value="CO">Colombia</option>
                        <option value="US">Estados Unidos</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save profile button — only for logged-in users */}
              {session?.user && (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded border border-cream-border text-xs font-semibold text-muted tracking-widest hover:border-dark/40 hover:text-dark transition-all disabled:opacity-50"
                >
                  <Save size={13} />
                  {saving ? "GUARDANDO..." : "GUARDAR INFORMACIÓN"}
                </button>
              )}
            </div>

            {/* Col 2: Payment method */}
            <div>
              {/* Payment info */}
              <div className="bg-white border border-cream-border rounded overflow-hidden">
                <div className="bg-cream-light px-5 py-3.5 border-b border-cream-border">
                  <h2 className="text-xs font-bold tracking-widest text-muted uppercase">Método de pago</h2>
                </div>
                <div className="p-5 space-y-5">

                  {/* Step 1: Purchase type */}
                  <div>
                    <p className="text-xs font-semibold text-muted tracking-wide mb-2.5">¿Dónde realizas tu compra?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(["nacional", "internacional"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handlePurchaseType(type)}
                          className={`flex flex-col items-center gap-1.5 p-4 rounded border-2 transition-all ${
                            purchaseType === type
                              ? "border-accent bg-accent/5"
                              : "border-cream-border hover:border-cream-dark"
                          }`}
                        >
                          <span className="text-xl">{type === "nacional" ? "🇨🇱" : "🌍"}</span>
                          <span className="text-sm font-semibold text-dark capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Payment mode (only if nacional) */}
                  {purchaseType === "nacional" && (
                    <div>
                      <p className="text-xs font-semibold text-muted tracking-wide mb-2.5">Modalidad de pago</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMode("abono70")}
                          className={`flex flex-col items-start gap-1 p-4 rounded border-2 transition-all text-left ${
                            paymentMode === "abono70"
                              ? "border-accent bg-accent/5"
                              : "border-cream-border hover:border-cream-dark"
                          }`}
                        >
                          <span className="text-sm font-semibold text-dark">Abono del 70%</span>
                          <span className="text-xs text-muted">Paga el 70% ahora, el 30% antes del despacho</span>
                          <span className="text-sm font-bold text-accent-dark mt-1">{fmt(Math.round(total * 0.7))}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMode("completa")}
                          className={`flex flex-col items-start gap-1 p-4 rounded border-2 transition-all text-left ${
                            paymentMode === "completa"
                              ? "border-accent bg-accent/5"
                              : "border-cream-border hover:border-cream-dark"
                          }`}
                        >
                          <span className="text-sm font-semibold text-dark">Transferencia completa</span>
                          <span className="text-xs text-muted">Paga el monto total ahora</span>
                          <span className="text-sm font-bold text-accent-dark mt-1">{fmt(total)}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bank transfer info */}
                  {purchaseType === "nacional" && paymentMode && (
                    bankAccount ? (
                      <div className="border-2 border-accent rounded bg-accent/5 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-accent/20">
                          <span className="text-lg">🏦</span>
                          <p className="text-sm font-semibold text-dark">Datos para transferencia</p>
                        </div>
                        <dl className="px-4 py-3 grid gap-2 text-sm">
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted shrink-0">Banco</dt>
                            <dd className="font-semibold text-dark text-right">{bankAccount.bankName}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted shrink-0">Titular</dt>
                            <dd className="font-semibold text-dark text-right">{bankAccount.accountName}</dd>
                          </div>
                          {bankAccount.rut && (
                            <div className="flex justify-between gap-4">
                              <dt className="text-muted shrink-0">RUT</dt>
                              <dd className="font-semibold text-dark text-right">{bankAccount.rut}</dd>
                            </div>
                          )}
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted shrink-0">Tipo de cuenta</dt>
                            <dd className="font-semibold text-dark text-right">{bankAccount.accountType}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted shrink-0">N° de cuenta</dt>
                            <dd className="font-semibold text-dark text-right">{bankAccount.accountNumber}</dd>
                          </div>
                          {bankAccount.email && (
                            <div className="flex justify-between gap-4">
                              <dt className="text-muted shrink-0">Correo</dt>
                              <dd className="font-semibold text-dark text-right">{bankAccount.email}</dd>
                            </div>
                          )}
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted shrink-0">Monto a transferir</dt>
                            <dd className="font-bold text-accent-dark text-right">
                              {paymentMode === "abono70" ? fmt(Math.round(total * 0.7)) : fmt(total)}
                            </dd>
                          </div>
                        </dl>
                        {bankAccount.instructions && (
                          <p className="px-4 pb-3 text-xs text-muted border-t border-accent/20 pt-2">
                            {bankAccount.instructions}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 border-2 border-accent rounded bg-accent/5">
                        <span className="text-2xl">🏦</span>
                        <div>
                          <p className="text-sm font-semibold text-dark">Transferencia bancaria</p>
                          <p className="text-xs text-muted mt-0.5">Los datos de la cuenta se mostrarán al confirmar tu pedido</p>
                        </div>
                      </div>
                    )
                  )}
                  {purchaseType === "internacional" && (
                    <div className="flex items-center gap-3 p-4 border-2 border-accent rounded bg-accent/5">
                      <span className="text-2xl">🏦</span>
                      <div>
                        <p className="text-sm font-semibold text-dark">Transferencia bancaria</p>
                        <p className="text-xs text-muted mt-0.5">Los datos de la cuenta se mostrarán al confirmar tu pedido</p>
                      </div>
                    </div>
                  )}

                  {/* Receipt upload — only for nacional with payment mode selected */}
                  {purchaseType === "nacional" && paymentMode && (
                    <div>
                      <p className="text-xs font-semibold text-muted tracking-wide mb-2.5">Comprobante de transferencia</p>
                      {receiptFile ? (
                        <div className="flex items-center gap-3 p-3.5 border-2 border-accent rounded bg-accent/5">
                          <FileCheck size={18} className="text-accent-dark shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-dark truncate">{receiptFile.name}</p>
                            <p className="text-xs text-muted">{(receiptFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReceiptFile(null)}
                            className="text-muted hover:text-red-500 transition-colors"
                            aria-label="Quitar archivo"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-cream-border rounded cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                          <Paperclip size={20} className="text-muted" />
                          <span className="text-xs text-center text-muted">
                            Arrastra tu comprobante aquí o <span className="text-accent-dark font-semibold underline underline-offset-2">selecciona un archivo</span>
                          </span>
                          <span className="text-[10px] text-muted/60">JPG, PNG, PDF — máx. 10 MB</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                            className="sr-only"
                            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Col 3: Order summary */}
            <div className="bg-white border border-cream-border rounded overflow-hidden sticky top-20">
              <div className="bg-cream-light px-5 py-3.5 border-b border-cream-border">
                <h2 className="text-xs font-bold tracking-widest text-muted uppercase">Resumen del pedido</h2>
              </div>
              <ul className="divide-y divide-cream-border px-4">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3.5">
                    <div className="w-14 h-14 bg-cream rounded overflow-hidden flex-shrink-0 relative border border-cream-border">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-contain" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-base font-serif text-muted">{item.name.charAt(0)}</span>
                      )}
                      <span className="absolute -top-1.5 -right-1.5 bg-dark text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center z-10">{item.qty}</span>
                    </div>
                    <span className="flex-1 text-sm text-dark truncate">{item.name}</span>
                    <span className="text-sm font-semibold text-dark">{fmt(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-4 border-t border-cream-border space-y-2">
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>Envío</span><span className="text-accent-dark font-medium">Gratis</span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>IVA (19%)</span><span>{fmt(tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-dark border-t border-cream-border pt-3 mt-2">
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button
                  type="submit"
                  disabled={loading || !isFormComplete}
                  className="w-full bg-dark text-white py-4 rounded text-sm font-bold tracking-widest hover:bg-dark-warm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "PROCESANDO..." : "CONFIRMAR PEDIDO →"}
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted">
                  <Lock size={11} />
                  <span>Transacción segura</span>
                </div>
              </div>
            </div>

          </div>
        </form>
      </main>
    </>
  );
}

function Input({ label, name, value, onChange, type = "text", required, placeholder }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-dark/70 tracking-wide">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        className="border border-cream-border rounded px-3 py-2.5 text-sm text-dark placeholder:text-cream-border focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}
