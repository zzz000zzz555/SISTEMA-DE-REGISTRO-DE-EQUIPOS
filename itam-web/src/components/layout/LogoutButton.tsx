"use client";

import { logoutClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await logoutClient(); router.push("/login"); }}
      className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
    >
      <LogOut size={16} /> Cerrar sesión
    </button>
  );
}
