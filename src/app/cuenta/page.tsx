import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import Header from "@/components/store/Header";
import SignOutButton from "@/components/store/SignOutButton";
import ProfileEditSection from "@/components/store/ProfileEditSection";
import CollapsibleSection from "@/components/store/CollapsibleSection";
import TrackingButton from "@/components/TrackingButton";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAYMENT_SUBMITTED: "Pago enviado",
  PAYMENT_CONFIRMED: "Pago confirmado",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAYMENT_SUBMITTED: "bg-blue-100 text-blue-800",
  PAYMENT_CONFIRMED: "bg-green-100 text-green-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function CuentaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/cuenta/login");

  const orders = await prisma.order.findMany({
    where: { customerEmail: session.user.email! },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* Bienvenida */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-muted uppercase mb-1.5">Bienvenido/a</p>
            <h1 className="font-serif text-3xl font-medium text-dark uppercase">{session.user.name}</h1>
            <p className="text-xs text-muted mt-1">{session.user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {/* Perfil editable */}
        <CollapsibleSection title="Mis datos">
          <ProfileEditSection />
        </CollapsibleSection>

        {/* Pedidos */}
        <CollapsibleSection
          title="Mis pedidos"
          badge={`${orders.length} pedido${orders.length !== 1 ? "s" : ""}`}
        >
          {orders.length === 0 ? (
            <div className="p-6 text-center bg-cream-light">
              <p className="text-sm text-muted mb-6">Aún no tienes pedidos realizados.</p>
              <Link
                href="/#all-products"
                className="inline-block bg-dark text-white text-[11px] font-semibold tracking-widest px-8 py-3 hover:bg-dark-warm transition-colors"
              >
                IR A LA TIENDA
              </Link>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-cream-border rounded-lg p-5 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-dark tracking-widest">#{order.orderNumber}</p>
                      <p className="text-[11px] text-dark/60 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                      <span className="text-sm font-bold text-dark">{fmt(order.total)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-dark/60 leading-relaxed">
                    {order.items.map((item) => `${item.productName} × ${item.qty}`).join(" · ")}
                  </p>

                  <div className="mt-3 pt-3 border-t border-cream-border flex flex-wrap items-center gap-4">
                    <Link
                      href={`/order/${order.id}`}
                      className="text-[11px] font-semibold tracking-wide text-dark hover:underline underline-offset-2"
                    >
                      Ver detalle del pedido →
                    </Link>
                    {order.trackingCode && (order.status === "SHIPPED" || order.status === "DELIVERED") && (
                      <TrackingButton trackingCode={order.trackingCode} endpoint="/api/tracking" variant="customer" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      </main>
    </>
  );
}
