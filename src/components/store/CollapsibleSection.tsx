"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CollapsibleSection({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mt-8 border border-cream-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-6 py-4 bg-white hover:bg-cream-light transition-colors group"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-xl font-medium text-dark">{title}</h2>
          {badge && <span className="text-xs text-dark/60">{badge}</span>}
        </div>
        <ChevronDown
          size={18}
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-cream-border">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
