"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Monitor, Wrench, Shield, Users, Boxes, FileText } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import type { Usuario } from "@/lib/types";

type Props = { user: Usuario; permissions: string[] };

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home, perm: null },
  { href: "/equipos", label: "Equipos Patrimoniales", icon: Monitor, perm: "EQUIPOS_VER" },
  { href: "/mantenimientos", label: "Mantenimientos", icon: Wrench, perm: null },
  { href: "/catalogos", label: "Catálogos", icon: Boxes, perm: null },
  { href: "/roles", label: "Roles y Permisos", icon: Shield, perm: null },
  { href: "/modulos", label: "Gestión de Módulos", icon: Boxes, perm: null },
  { href: "/usuarios", label: "Usuarios y Sesiones", icon: Users, perm: null },
  { href: "/auditoria", label: "Auditoría Forense", icon: FileText, perm: null },
];

export function Sidebar({ user, permissions }: Props) {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">IT</div>
          <div>
            <div className="font-bold text-sm">ITAM</div>
            <div className="text-xs text-slate-400">Inventario TI</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          if (item.perm && !permissions.includes(item.perm) && user.id_rol !== 1) return null;
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active ? "bg-indigo-600 text-white" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <div className="text-xs text-slate-400 mb-2">{user.nombres} {user.apellidos}</div>
        <LogoutButton />
      </div>
    </aside>
  );
}