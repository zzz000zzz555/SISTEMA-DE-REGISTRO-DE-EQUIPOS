"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Monitor, Wrench, Shield, Users, Boxes, FileText, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home, group: "Módulos" },
  { href: "/equipos", label: "Equipos Patrimoniales", icon: Monitor, group: "Módulos" },
  { href: "/mantenimientos", label: "Mantenimientos", icon: Wrench, group: "Módulos" },
  { href: "/catalogos", label: "Catálogos", icon: Boxes, group: "Módulos" },
  { href: "/roles", label: "Roles y Permisos", icon: Shield, group: "Módulos" },
  { href: "/modulos", label: "Gestión de Módulos", icon: Boxes, group: "Módulos" },
  { href: "/usuarios", label: "Usuarios y Sesiones", icon: Users, group: "Módulos" },
  { href: "/auditoria", label: "Auditoría Forense", icon: FileText, group: "Módulos" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [equipos, setEquipos] = useState<{ id_equipo: string; codigo_patrimonial: string; codigo_barras: string; numero_serie: string | null }[]>([]);
  // const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const admin = createClient();
    admin.from("equipos").select("id_equipo,codigo_patrimonial,codigo_barras,numero_serie").limit(50).then(({ data }) => {
      setEquipos(data ?? []);
    });
  }, [open]);

  if (!open) return null;

  const filteredEquipos = equipos.filter((e) =>
    !query ||
    e.codigo_patrimonial.toLowerCase().includes(query.toLowerCase()) ||
    e.codigo_barras.toLowerCase().includes(query.toLowerCase()) ||
    (e.numero_serie ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <Command className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border overflow-hidden">
          <div className="flex items-center gap-2 px-4 border-b">
            <Search size={16} className="text-slate-400" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar equipo o módulo..."
              className="flex-1 py-3 outline-none text-sm"
            />
            <kbd className="text-xs text-slate-400 border rounded px-1.5 py-0.5">Esc</kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-400">Sin resultados</Command.Empty>
            <Command.Group heading="Módulos" className="text-xs text-slate-400 px-2 py-1">
              {nav.filter((n) => n.label.toLowerCase().includes(query.toLowerCase())).map((n) => (
                <Command.Item
                  key={n.href}
                  onSelect={() => { window.location.href = "/SISTEMA-DE-REGISTRO-DE-EQUIPOS" + n.href + "/"; }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                >
                  <n.icon size={14} /> {n.label}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Equipos" className="text-xs text-slate-400 px-2 py-1">
              {filteredEquipos.map((e) => (
                <Command.Item
                  key={e.id_equipo}
                  onSelect={() => { window.location.href = `/SISTEMA-DE-REGISTRO-DE-EQUIPOS/equipos/?eq=${e.id_equipo}`; }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-mono"
                >
                  <Monitor size={14} /> {e.codigo_patrimonial} <span className="text-slate-400 text-xs">{e.codigo_barras}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

