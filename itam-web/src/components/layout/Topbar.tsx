"use client";

import { Search } from "lucide-react";
import type { Usuario } from "@/lib/types";

export function Topbar({ user }: { user: Usuario }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500 hover:bg-slate-100 w-72"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Buscar equipo o módulo...</span>
        <kbd className="text-[10px] border rounded px-1.5 py-0.5 bg-white">Ctrl K</kbd>
      </button>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-slate-900">{user.nombres} {user.apellidos}</div>
          <div className="text-xs text-slate-500">{user.correo_corporativo}</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
          {user.nombres[0]}{user.apellidos[0]}
        </div>
      </div>
    </header>
  );
}
