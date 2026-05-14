"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, FileText, ExternalLink, Package, MapPin, Clock } from "lucide-react";
import toast from "react-hot-toast";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

const NEXT_STATUS: Record<string, { label: string; status: string; color: string }> = {
  PENDING_PAYMENT: { label: "Marcar transferencia recibida", status: "PAYMENT_SUBMITTED", color: "bg-blue-600 hover:bg-blue-700" },
  PAYMENT_SUBMITTED: { label: "✓ Confirmar pago", status: "PAYMENT_CONFIRMED", color: "bg-green-600 hover:bg-green-700" },
  PAYMENT_CONFIRMED: { label: "Marcar en proceso", status: "PROCESSING", color: "bg-purple-600 hover:bg-purple-700" },
  PROCESSING: { label: "Marcar como enviado", status: "SHIPPED", color: "bg-indigo-600 hover:bg-indigo-700" },
  SHIPPED: { label: "Marcar como entregado", status: "DELIVERED", color: "bg-emerald-600 hover:bg-emerald-700" },
};

interface Order {
  id: string; orderNumber: string; status: string;
  customerName: string; customerEmail: string; customerPhone?: string;
  address: string; city: string; state?: string; zip: string; country: string;
  subtotal: number; tax: number; total: number;
  adminNote?: string; trackingCode?: string | null; confirmedAt?: string; createdAt: string;
  receiptUrl?: string | null;
  bankAccount?: { bankName: string; accountNumber: string; accountName: string };
  items: Array<{ id: string; productName: string; price: number; qty: number }>;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [note, setNote] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingValidated, setTrackingValidated] = useState<null | "valid" | "invalid">(null);
  const [validating, setValidating] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<null | { status: string; events: { time: string; location: string; description: string }[] }>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d.order);
        setNote(d.order.adminNote ?? "");
        setTrackingCode(d.order.trackingCode ?? "");
        if (d.order.trackingCode) {
          fetchTracking(d.order.trackingCode);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function validateTracking() {
    setValidating(true);
    setTrackingValidated(null);
    try {
      const res = await fetch("/api/admin/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trackingCode.trim() }),
      });
      const data = await res.json();
      const meta = data?.meta as { code?: number } | undefined;
      const validCodes = [200, 4014]; // 4014 = ya registrado, también es válido
      setTrackingValidated(res.ok && validCodes.includes(meta?.code ?? 0) ? "valid" : "invalid");
    } catch {
      setTrackingValidated("invalid");
    }
    setValidating(false);
  }

  async function fetchTracking(code: string) {
    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/admin/tracking?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      // El endpoint GET /v4/trackings devuelve data como array
      // GET /v4/trackings/get devuelve data como array; filtramos por tracking_number
      const items: Record<string, unknown>[] = Array.isArray(data?.data) ? data.data : [];
      const item = items.find((i) => i.tracking_number === code) ?? items[0];
      if (item) {
        type TrackInfo = { tracking_detail: string; checkpoint_date: string; location: string };
        const rawEvents: TrackInfo[] = (item.origin_info as { trackinfo: TrackInfo[] })?.trackinfo ?? [];
        setTrackingInfo({
          status: (item.latest_event as string) ?? (item.delivery_status as string) ?? "Sin información",
          events: rawEvents.map((e) => ({
            description: e.tracking_detail ?? "",
            time: e.checkpoint_date ?? "",
            location: e.location ?? "",
          })),
        });
      }
    } catch { /* silencioso */ }
    setTrackingLoading(false);
  }

  async function updateStatus(status: string) {
    setUpdating(true);
    const body: Record<string, string> = { status, adminNote: note };
    if (status === "SHIPPED") { body.trackingCode = trackingCode; }
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setOrder(data.order);
      toast.success("Estado actualizado");
      if (status === "PAYMENT_CONFIRMED") {
        toast("Verificando rotación de cuenta...", { icon: "🔄" });
      }
      if (status === "SHIPPED" && trackingCode) {
        fetchTracking(trackingCode);
      }
    } else {
      toast.error("Error al actualizar");
    }
    setUpdating(false);
  }

  async function saveNote() {
    setUpdating(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: note }),
    });
    toast.success("Nota guardada");
    setUpdating(false);
  }

  async function cancelOrder() {
    if (!confirm("¿Cancelar esta orden?")) return;
    await updateStatus("CANCELLED");
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Cargando...</div>;
  if (!order) return <div className="p-6 text-sm text-red-500">Orden no encontrada.</div>;

  const nextAction = NEXT_STATUS[order.status];

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders" className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-800">{order.orderNumber}</h1>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Col 1: Siguiente acción, Productos, Nota interna */}
        <div className="space-y-5">
          {nextAction && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Siguiente acción</h2>

              {order.status === "PROCESSING" && (
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Package size={12} />
                    Código de seguimiento
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackingCode}
                      onChange={(e) => { setTrackingCode(e.target.value); setTrackingValidated(null); }}
                      placeholder="Ej: CL123456789"
                      className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={validateTracking}
                      disabled={!trackingCode.trim() || validating}
                      className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {validating ? <RefreshCw size={12} className="animate-spin" /> : "Validar"}
                    </button>
                  </div>
                  {trackingValidated === "valid" && (
                    <p className="text-[11px] text-green-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle size={11} /> Código válido y registrado en TrackingMore.
                    </p>
                  )}
                  {trackingValidated === "invalid" && (
                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                      <XCircle size={11} /> No se pudo validar el código. Verifica que sea correcto.
                    </p>
                  )}
                  {!trackingCode.trim() && trackingValidated === null && (
                    <p className="text-[11px] text-amber-600 mt-1.5">Ingresa el código de seguimiento para continuar.</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => updateStatus(nextAction.status)}
                  disabled={updating || (order.status === "PROCESSING" && !trackingCode.trim())}
                  className={`flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded transition-colors disabled:opacity-60 ${nextAction.color}`}
                >
                  <CheckCircle size={15} />
                  {nextAction.label}
                </button>
                {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                  <button
                    onClick={cancelOrder}
                    disabled={updating}
                    className="text-sm text-red-600 border border-red-200 px-4 py-2.5 rounded hover:bg-red-50 transition-colors"
                  >
                    Cancelar orden
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</h2>
            </div>
            <table className="w-full admin-table">
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="text-sm text-gray-800">{item.productName}</td>
                    <td className="text-sm text-gray-500 text-center">×{item.qty}</td>
                    <td className="text-sm font-semibold text-gray-800 text-right">{fmt(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={2} className="text-xs text-gray-500">Subtotal</td>
                  <td className="text-sm text-gray-700 text-right">{fmt(order.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-xs text-gray-500">IVA</td>
                  <td className="text-sm text-gray-700 text-right">{fmt(order.tax)}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="text-sm font-bold text-gray-800">Total</td>
                  <td className="text-base font-bold text-gray-800 text-right">{fmt(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Nota interna</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota para el equipo (no visible para el cliente)..."
              rows={3}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
            />
            <button
              onClick={saveNote}
              disabled={updating}
              className="mt-2 text-xs bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
            >
              Guardar nota
            </button>
          </div>
        </div>

        {/* Col 2: Cliente, Dirección, Cuenta bancaria */}
        <div className="space-y-5">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cliente</h2>
            <p className="text-sm font-semibold text-gray-800">{order.customerName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{order.customerEmail}</p>
            {order.customerPhone && <p className="text-xs text-gray-500">{order.customerPhone}</p>}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dirección de envío</h2>
            <p className="text-sm text-gray-700">{order.address}</p>
            <p className="text-sm text-gray-700">{order.city}{order.state ? `, ${order.state}` : ""}</p>
            <p className="text-sm text-gray-700">{order.zip} — {order.country}</p>
          </div>

          {order.bankAccount && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cuenta bancaria asignada</h2>
              <p className="text-sm font-semibold text-gray-800">{order.bankAccount.bankName}</p>
              <p className="text-xs text-gray-500">{order.bankAccount.accountName}</p>
              <p className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded mt-1.5">{order.bankAccount.accountNumber}</p>
            </div>
          )}
        </div>

        {/* Col 3: Comprobante, Fechas */}
        <div className="space-y-5">
          {order.receiptUrl ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <FileText size={14} className="text-amber-600" />
                <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Comprobante de transferencia</h2>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {/\.(jpe?g|png|webp|gif)$/i.test(order.receiptUrl) ? (
                  <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.receiptUrl}
                      alt="Comprobante"
                      className="w-full rounded border border-gray-200 object-contain max-h-72 hover:opacity-90 transition-opacity"
                    />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <FileText size={20} className="text-gray-400" />
                    <span className="text-sm text-gray-600 flex-1 truncate">Comprobante PDF</span>
                  </div>
                )}
                <a
                  href={order.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink size={12} />
                  Ver en tamaño completo
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-dashed border-gray-200 p-4 flex items-center gap-3 text-gray-400">
              <FileText size={16} />
              <span className="text-xs">Sin comprobante adjunto</span>
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fechas</h2>
            <div className="space-y-1.5 text-xs text-gray-500">
              <p>Creado: <span className="text-gray-700">{new Date(order.createdAt).toLocaleString("es-CL")}</span></p>
              {order.confirmedAt && (
                <p>Confirmado: <span className="text-gray-700">{new Date(order.confirmedAt).toLocaleString("es-CL")}</span></p>
              )}
            </div>
          </div>

          {order.trackingCode && (
            <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Package size={12} />
                  Seguimiento
                </h2>
              </div>
              <p className="font-mono text-sm font-semibold text-indigo-800 bg-white border border-indigo-100 px-3 py-2 rounded mb-3">
                {order.trackingCode}
              </p>

              {trackingLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 py-2">
                  <RefreshCw size={11} className="animate-spin" />
                  Consultando estado...
                </div>
              )}

              {!trackingLoading && trackingInfo && (
                <div>
                  <div className="flex items-center gap-2 mb-3 p-2.5 bg-white rounded border border-indigo-100">
                    <MapPin size={13} className="text-indigo-500 shrink-0" />
                    <p className="text-xs font-semibold text-indigo-800">{trackingInfo.status}</p>
                  </div>
                  {trackingInfo.events.length > 0 && (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {trackingInfo.events.map((ev, i) => (
                        <div key={i} className="flex gap-2.5">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${i === 0 ? "bg-indigo-500" : "bg-indigo-200"}`} />
                            {i < trackingInfo.events.length - 1 && <div className="w-px flex-1 bg-indigo-100 my-0.5" />}
                          </div>
                          <div className="pb-2">
                            <p className="text-xs text-gray-700 leading-snug">{ev.description}</p>
                            {ev.location && <p className="text-[10px] text-gray-400 mt-0.5">{ev.location}</p>}
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock size={9} /> {ev.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!trackingLoading && !trackingInfo && (
                <p className="text-[11px] text-indigo-400">Sin información de seguimiento aún.</p>
              )}

              <button
                onClick={() => fetchTracking(order.trackingCode!)}
                disabled={trackingLoading}
                className="mt-3 flex items-center gap-1.5 text-[11px] text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={10} className={trackingLoading ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
