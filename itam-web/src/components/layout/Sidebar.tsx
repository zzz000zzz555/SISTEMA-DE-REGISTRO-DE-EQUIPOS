"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Monitor, Wrench, Boxes, ShieldCheck, Users, FileText, HardDrive, Keyboard, Printer, Speaker, Headphones,
} from "lucide-react";
import type { Usuario } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";

type Props = { user: Usuario; permissions: string[] };

const groups = [
  {
    label: "Operaciones ITAM",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: null },
      { href: "/equipos", label: "Equipos Patrimoniales", icon: Monitor, perm: "EQUIPOS_VER" },
      { href: "/mantenimientos", label: "Mantenimientos", icon: Wrench, perm: null },
    ],
  },
  {
    label: "Catálogos",
    items: [
      { href: "/catalogos", label: "Catálogos Maestros", icon: Boxes, perm: null },
    ],
  },
  {
    label: "Administración y Seguridad",
    items: [
      { href: "/roles", label: "Roles y Permisos", icon: ShieldCheck, perm: null },
      { href: "/modulos", label: "Gestión de Módulos", icon: Boxes, perm: null },
      { href: "/usuarios", label: "Usuarios y Sesiones", icon: Users, perm: null },
      { href: "/auditoria", label: "Auditoría Forense", icon: FileText, perm: null },
    ],
  },
];

export function Sidebar({ user, permissions }: Props) {
  const pathname = usePathname();
  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
      <div className="h-14 px-4 flex items-center gap-2 border-b border-slate-200">
        <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-sm">IT</div>
        <div>
          <div className="font-semibold text-sm text-slate-900">ITAM</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Inventario TI</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{g.label}</div>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                if (item.perm && !permissions.includes(item.perm) && user.id_rol !== 1) return null;
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition ${
                      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-200 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
          {user.nombres[0]}{user.apellidos[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-900 truncate">{user.nombres} {user.apellidos}</div>
          <div className="text-[10px] text-slate-400 truncate">{user.correo_corporativo}</div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
