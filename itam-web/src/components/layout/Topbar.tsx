"use client";

import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { Usuario } from "@/lib/types";

export function Topbar({ user }: { user: Usuario }) {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <header className="h-14 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 backdrop-blur">
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
        className="flex items-center justify-center sm:justify-start gap-2 px-0 sm:px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-9 sm:w-72"
      >
        <Search size={14} />
        <span className="hidden flex-1 text-left sm:block">Buscar equipo o módulo...</span>
        <kbd className="hidden text-[10px] border rounded px-1.5 py-0.5 bg-white dark:bg-slate-900 sm:inline-block">Ctrl K</kbd>
      </button>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          title="Cambiar tema"
          aria-label="Cambiar tema"
        >
          <Sun size={16} className="hidden dark:block" />
          <Moon size={16} className="block dark:hidden" />
        </button>
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.nombres} {user.apellidos}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{user.correo_corporativo}</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
          {user.nombres[0]}{user.apellidos[0]}
        </div>
      </div>
    </header>
  );
}

