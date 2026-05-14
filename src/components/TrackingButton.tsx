"use client";

import { useState } from "react";
import { Package, RefreshCw, MapPin, Clock, X } from "lucide-react";

interface TrackingInfo {
  status: string;
  events: { time: string; location: string; description: string }[];
}

interface Props {
  trackingCode: string;
  endpoint: string;
  variant?: "admin" | "customer";
}

export default function TrackingButton({ trackingCode, endpoint, variant = "admin" }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<TrackingInfo | null>(null);
  const [fetched, setFetched] = useState(false);

  async function load() {
    setOpen(true);
    if (fetched) return;
    setLoading(true);
    try {
      const res = await fetch(`${endpoint}?code=${encodeURIComponent(trackingCode)}`);
      const data = await res.json();
      const items: Record<string, unknown>[] = Array.isArray(data?.data) ? data.data : [];
      const item = items.find((i) => i.tracking_number === trackingCode) ?? items[0];
      if (item) {
        type TrackInfo = { tracking_detail: string; checkpoint_date: string; location: string };
        const rawEvents: TrackInfo[] = (item.origin_info as { trackinfo: TrackInfo[] })?.trackinfo ?? [];
        setInfo({
          status: (item.latest_event as string) ?? (item.delivery_status as string) ?? "Sin información",
          events: rawEvents.map((e) => ({
            description: e.tracking_detail ?? "",
            time: e.checkpoint_date ?? "",
            location: e.location ?? "",
          })),
        });
      }
    } catch { /* silencioso */ }
    setFetched(true);
    setLoading(false);
  }

  async function refresh() {
    setFetched(false);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch(`${endpoint}?code=${encodeURIComponent(trackingCode)}`);
      const data = await res.json();
      const items: Record<string, unknown>[] = Array.isArray(data?.data) ? data.data : [];
      const item = items.find((i) => i.tracking_number === trackingCode) ?? items[0];
      if (item) {
        type TrackInfo = { tracking_detail: string; checkpoint_date: string; location: string };
        const rawEvents: TrackInfo[] = (item.origin_info as { trackinfo: TrackInfo[] })?.trackinfo ?? [];
        setInfo({
          status: (item.latest_event as string) ?? (item.delivery_status as string) ?? "Sin información",
          events: rawEvents.map((e) => ({
            description: e.tracking_detail ?? "",
            time: e.checkpoint_date ?? "",
            location: e.location ?? "",
          })),
        });
      }
    } catch { /* silencioso */ }
    setFetched(true);
    setLoading(false);
  }

  const trigger =
    variant === "admin" ? (
      <button
        onClick={load}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded transition-colors"
      >
        <Package size={11} />
        Tracking
      </button>
    ) : (
      <button
        onClick={load}
        className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-indigo-700 hover:underline underline-offset-2"
      >
        <Package size={11} />
        Ver estado del envío →
      </button>
    );

  return (
    <>
      {trigger}

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-800">Estado del envío</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Tracking code */}
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Código de seguimiento</p>
              <p className="font-mono text-sm font-bold text-gray-800 bg-gray-50 border border-gray-200 px-3 py-2 rounded mb-4">
                {trackingCode}
              </p>

              {/* Loading */}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
                  <RefreshCw size={14} className="animate-spin" />
                  Consultando estado...
                </div>
              )}

              {/* Content */}
              {!loading && fetched && (
                <>
                  {info ? (
                    <>
                      <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded mb-4">
                        <MapPin size={14} className="text-indigo-500 shrink-0" />
                        <p className="text-sm font-semibold text-indigo-800">{info.status}</p>
                      </div>

                      {info.events.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {info.events.map((ev, i) => (
                            <div key={i} className="flex gap-2.5">
                              <div className="flex flex-col items-center">
                                <div className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${i === 0 ? "bg-indigo-500" : "bg-indigo-200"}`} />
                                {i < info.events.length - 1 && <div className="w-px flex-1 bg-indigo-100 my-0.5" />}
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
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-4">Aún no hay eventos de seguimiento.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6">
                      No se encontró información de seguimiento para este código.
                    </p>
                  )}

                  <button
                    onClick={refresh}
                    className="mt-4 flex items-center gap-1.5 text-[11px] text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    <RefreshCw size={10} />
                    Actualizar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
