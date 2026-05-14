import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";
import TrackingButton from "@/components/TrackingButton";

export const metadata = { title: "Órdenes" };
export const dynamic = "force-dynamic";

const STATUSES = ["ALL", "PENDING_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = statusParam || "ALL";
  const page = parseInt(pageParam || "1");
  const limit = 20;

  const where = status !== "ALL" ? { status: status as never } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">Órdenes</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              status === s
                ? "bg-dark text-white border-dark"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {s === "ALL" ? "Todas" : STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full admin-table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 tracking-wide">Orden</th>
              <th className="text-left text-xs font-semibold text-gray-500 tracking-wide">Cliente</th>
              <th className="text-left text-xs font-semibold text-gray-500 tracking-wide hidden sm:table-cell">Fecha</th>
              <th className="text-left text-xs font-semibold text-gray-500 tracking-wide">Total</th>
              <th className="text-left text-xs font-semibold text-gray-500 tracking-wide">Estado</th>
              <th className="text-left text-xs font-semibold text-gray-500 tracking-wide hidden md:table-cell">Tracking</th>
              <th className="text-right text-xs font-semibold text-gray-500 tracking-wide">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No hay órdenes en esta categoría.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td>
                    <p className="font-mono text-xs font-semibold text-gray-800">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{order.items.length} artículo(s)</p>
                  </td>
                  <td>
                    <p className="text-sm text-gray-800">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.customerEmail}</p>
                  </td>
                  <td className="hidden sm:table-cell text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("es-CL")}
                  </td>
                  <td className="text-sm font-semibold text-gray-800">{fmt(order.total)}</td>
                  <td>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">
                    {order.trackingCode && (order.status === "SHIPPED" || order.status === "DELIVERED") ? (
                      <TrackingButton trackingCode={order.trackingCode} endpoint="/api/admin/tracking" variant="admin" />
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs text-accent-dark underline underline-offset-2 hover:text-dark"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?status=${status}&page=${p}`}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                page === p ? "bg-dark text-white" : "border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
