"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Monitor, Wrench, Boxes, ShieldCheck, Users, FileText, HardDrive, Keyboard, Printer, Speaker, Headphones,
} from "lucide-react";
import type { Usuario } from "@/lib/types";
import { LogoutButton } from "./LogoutButton";
import { BeruLogo } from "@/components/ui/BeruLogo";

type Props = { user: Usuario; permissions: string[] };

const groups = [
  {
    label: "Operaciones BERU",
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
    <aside className="w-64 bg-[#090D16] text-slate-300 flex flex-col min-h-screen border-r border-slate-800">
      <div className="h-16 px-4 flex items-center gap-2 border-b border-slate-800">
        <BeruLogo size="sm" />
      </div>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{g.label}</div>
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
                      active ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
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
