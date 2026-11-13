"use client";

import { logoutClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={async () => { await logoutClient(); window.location.href = "/SISTEMA-DE-REGISTRO-DE-EQUIPOS/login/"; }}
      className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
    >
      <LogOut size={16} /> Cerrar sesión
    </button>
  );
}

