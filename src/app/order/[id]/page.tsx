import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/store/Header";
import { BankRow } from "@/components/store/BankRow";
import { CheckCircle } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, bankAccount: true },
  });

  if (!order) notFound();

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-12 pb-20">

        {/* Success header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-accent-dark" />
          </div>
          <h1 className="font-serif text-3xl font-medium text-dark mb-2">¡Pedido confirmado!</h1>
          <p className="text-muted text-sm">Gracias, <strong className="text-dark">{order.customerName}</strong>. Hemos recibido tu pedido.</p>
          <div className="inline-block bg-cream border border-cream-border rounded px-4 py-2 mt-3 text-sm">
            Número de pedido: <strong className="text-dark">{order.orderNumber}</strong>
          </div>
        </div>

        {/* Bank transfer instructions */}
        {order.bankAccount && (
          <div className="bg-white border-2 border-accent rounded overflow-hidden mb-6">
            <div className="bg-accent/10 px-5 py-4 border-b border-accent/30">
              <h2 className="font-semibold text-dark text-sm">🏦 Instrucciones de transferencia</h2>
              <p className="text-xs text-muted mt-1">Realiza la transferencia para completar tu pedido</p>
            </div>
            <div className="p-5 space-y-3">
              <BankRow label="Banco" value={order.bankAccount.bankName} />
              <BankRow label="Titular" value={order.bankAccount.accountName} />
              <BankRow label="Tipo de cuenta" value={order.bankAccount.accountType} />
              <BankRow label="Número de cuenta" value={order.bankAccount.accountNumber} copyable />
              {order.bankAccount.rut && <BankRow label="RUT" value={order.bankAccount.rut} copyable />}
              {order.bankAccount.email && <BankRow label="Email" value={order.bankAccount.email} copyable />}
              <div className="border-t border-cream-border pt-3">
                {order.paymentType === "nacional_abono70" ? (
                  <>
                    <BankRow label="Monto a transferir (70%)" value={fmt(Math.round(order.total * 0.7))} highlight />
                    <p className="text-xs text-muted mt-2">
                      Este monto corresponde al 70% de tu pedido. El 30% restante ({fmt(order.total - Math.round(order.total * 0.7))}) se coordinará antes del despacho.
                    </p>
                  </>
                ) : (
                  <BankRow label="Monto a transferir" value={fmt(order.total)} highlight />
                )}
                <p className="text-xs text-muted mt-2">
                  ⚠️ Incluye el número de pedido <strong>{order.orderNumber}</strong> en el comentario de la transferencia.
                </p>
              </div>
              {order.bankAccount.instructions && (
                <p className="text-xs text-muted bg-cream rounded p-3">{order.bankAccount.instructions}</p>
              )}
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white border border-cream-border rounded overflow-hidden mb-6">
          <div className="bg-cream-light px-5 py-3.5 border-b border-cream-border">
            <h2 className="text-xs font-bold tracking-widest text-muted uppercase">Detalle del pedido</h2>
          </div>
          <ul className="divide-y divide-cream-border px-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between items-center py-3 text-sm">
                <span className="text-dark">{item.productName} <span className="text-muted">×{item.qty}</span></span>
                <span className="font-semibold text-dark">{fmt(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-4 border-t border-cream-border space-y-1.5 text-sm">
            <div className="flex justify-between text-muted"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            <div className="flex justify-between text-muted"><span>IVA</span><span>{fmt(order.tax)}</span></div>
            <div className="flex justify-between font-bold text-dark text-base border-t border-cream-border pt-2 mt-1">
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-cream rounded p-4 text-sm text-muted mb-8">
          <p className="font-semibold text-dark text-xs tracking-widest uppercase mb-2">Dirección de envío</p>
          <p>{order.address}, {order.city}{order.state ? `, ${order.state}` : ""}</p>
          <p>{order.zip} — {order.country}</p>
        </div>

        <div className="text-center">
          <Link href="/" className="inline-block bg-dark text-white px-8 py-3.5 rounded text-sm font-semibold tracking-widest hover:bg-dark-warm transition-colors">
            VOLVER A LA TIENDA
          </Link>
        </div>
      </main>
    </>
  );
}

