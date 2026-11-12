"use client";

import { logoutAction } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => logoutAction()}
      className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
    >
      <LogOut size={16} /> Cerrar sesión
    </button>
  );
}