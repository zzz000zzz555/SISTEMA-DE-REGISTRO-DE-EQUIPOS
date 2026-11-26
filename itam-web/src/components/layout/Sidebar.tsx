"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Monitor, Wrench, Boxes, ShieldCheck, Users, FileText, Activity,
  Network, Keyboard, Printer, HardDrive, Server, Globe2, KeyRound, Package,
} from "lucide-react";
import type { Usuario } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";
import { BeruLogo } from "@/components/ui/BeruLogo";
import { withBase } from "@/lib/utils";

type Props = { user: Usuario; permissions: string[] };

const groups = [
  {
    label: "General",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: null },
      { href: "/reportes", label: "Reportes", icon: FileText, perm: null },
    ],
  },
  {
    label: "Módulo 1 · Servicios",
    items: [
      { href: "/informes", label: "1.1 Informes Técnicos", icon: FileText, perm: null },
      { href: "/almacen", label: "1.3 Almacén de Cómputo", icon: Package, perm: null },
      { href: "/mantenimientos", label: "1.2 Mantenimientos", icon: Wrench, perm: null },
    ],
  },
  {
    label: "Módulo 2 · Redes",
    items: [
      { href: "/ip-inventario", label: "2.1 Matriz IP / Subredes", icon: Network, perm: null },
      { href: "/ip-rangos", label: "2.2 Rangos por Área", icon: Network, perm: null },
      { href: "/ip-pronatel", label: "2.3 IP PRONATEL", icon: Globe2, perm: null },
      { href: "/anydesk", label: "2.4 AnyDesk Emergencia", icon: KeyRound, perm: null },
    ],
  },
  {
    label: "Módulo 3 · Inventario",
    items: [
      { href: "/equipos", label: "3.1 Computadoras", icon: Monitor, perm: "EQUIPOS_VER" },
      { href: "/monitores", label: "3.2 Monitores", icon: Server, perm: null },
      { href: "/teclados", label: "3.3 Teclados", icon: Keyboard, perm: null },
      { href: "/impresoras", label: "3.4 Impresoras", icon: Printer, perm: null },
      { href: "/otros-equipos", label: "3.5 Otros Equipos", icon: HardDrive, perm: null },
    ],
  },
  {
    label: "Catálogos",
    items: [
      { href: "/catalogos", label: "Catálogos Maestros", icon: Boxes, perm: null },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/roles", label: "Roles y Permisos", icon: ShieldCheck, perm: null },
      { href: "/modulos", label: "Módulos", icon: Boxes, perm: null },
      { href: "/usuarios", label: "Usuarios", icon: Users, perm: null },
      { href: "/auditoria", label: "Auditoría", icon: FileText, perm: null },
      { href: "/auditoria-sesiones", label: "Sesiones", icon: FileText, perm: "VER_AUDITORIA_SESIONES" },
      { href: "/monitor", label: "Monitor", icon: Activity, perm: "VER_AUDITORIA_SESIONES" },
    ],
  },
];

export function Sidebar({ user, permissions }: Props) {
  const pathname = usePathname();
  return (
    <aside className="w-60 bg-slate-950 text-slate-300 flex flex-col min-h-screen border-r border-slate-800">
      <div className="h-14 px-4 flex items-center gap-2 border-b border-slate-800">
        <BeruLogo size="sm" />
      </div>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{g.label}</div>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                if (item.perm && !permissions.includes(item.perm) && user.id_rol !== 1) return null;
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <a
                    key={item.href}
                    href={withBase(item.href)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors duration-150 ${
                      active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
          {user.nombres[0]}{user.apellidos[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">{user.nombres} {user.apellidos}</div>
          <div className="text-[10px] text-slate-500 truncate">{user.correo_corporativo}</div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
