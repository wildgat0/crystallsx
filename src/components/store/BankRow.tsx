"use client";

import { Copy } from "lucide-react";

export function BankRow({ label, value, copyable, highlight }: {
  label: string; value: string; copyable?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted w-32 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className={`text-sm font-semibold ${highlight ? "text-accent-dark text-base" : "text-dark"}`}>{value}</span>
        {copyable && (
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="text-muted hover:text-dark transition-colors"
            title="Copiar"
          >
            <Copy size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
