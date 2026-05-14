import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalOrders, pendingOrders, confirmedOrders, recentOrders, activeBankAccount, rotationCfg] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.order.count({ where: { status: "PAYMENT_CONFIRMED" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { bankAccount: true },
      }),
      prisma.bankAccount.findFirst({ where: { active: true } }),
      Promise.all([
        prisma.appConfig.findUnique({ where: { key: "rotation_threshold" } }),
        prisma.appConfig.findUnique({ where: { key: "orders_since_rotation" } }),
      ]),
    ]);

  const [threshold, sinceRotation] = rotationCfg;
  const thresholdVal = parseInt(threshold?.value ?? "0");
  const sinceVal = parseInt(sinceRotation?.value ?? "0");
  const progress = thresholdVal > 0 ? Math.min((sinceVal / thresholdVal) * 100, 100) : 0;

  const totalRevenue = await prisma.order.aggregate({
    where: { status: { in: ["PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
    _sum: { total: true },
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total órdenes" value={String(totalOrders)} />
        <StatCard label="Pendientes de pago" value={String(pendingOrders)} accent />
        <StatCard label="Pagos confirmados" value={String(confirmedOrders)} />
        <StatCard label="Ingresos confirmados" value={fmt(totalRevenue._sum.total ?? 0)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bank account status */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Cuenta bancaria activa</h2>
          {activeBankAccount ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-sm font-semibold text-gray-800">{activeBankAccount.bankName}</span>
              </div>
              <p className="text-xs text-gray-500">{activeBankAccount.accountName}</p>
              <p className="text-xs font-mono text-gray-700 bg-gray-50 px-3 py-1.5 rounded">{activeBankAccount.accountNumber}</p>

              {thresholdVal > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progreso de rotación</span>
                    <span>{sinceVal} / {thresholdVal} órdenes</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-dark rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Sin cuenta activa.{" "}
              <Link href="/admin/bank-accounts" className="text-accent-dark underline underline-offset-2">Agregar cuenta</Link>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Últimas órdenes</h2>
            <Link href="/admin/orders" className="text-xs text-accent-dark underline underline-offset-2">Ver todas</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400">No hay órdenes aún.</p>
          ) : (
            <ul className="space-y-2">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="flex items-center justify-between py-2 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{order.customerName}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-yellow-700" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}
