"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-1.5 text-xs text-muted hover:text-dark transition-colors"
    >
      <LogOut size={14} />
      Cerrar sesión
    </button>
  );
}
