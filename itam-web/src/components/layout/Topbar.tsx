"use client";

import { Search, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { Usuario } from "@/lib/types";

export function Topbar({ user }: { user: Usuario }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 w-72"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Buscar equipo o módulo...</span>
        <kbd className="text-[10px] border rounded px-1.5 py-0.5 bg-white dark:bg-slate-900">Ctrl K</kbd>
      </button>
      <div className="flex items-center gap-3">
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Cambiar tema"
          >
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
        <div className="text-right">
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

