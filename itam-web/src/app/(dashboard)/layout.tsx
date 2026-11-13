"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { PermissionsProvider } from "@/lib/permissions-context";
import { getSession, type AuthSession } from "@/lib/auth-client";
import type { Usuario } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { window.location.href = "/SISTEMA-DE-REGISTRO-DE-EQUIPOS/login/"; return; }
    setSession(s);
    setReady(true);
  }, []);

  if (!ready || !session) return <div className="flex h-screen items-center justify-center text-slate-400">Cargando...</div>;

  const user = {
    id_usuario: session.user.id_usuario,
    id_rol: session.user.id_rol,
    tipo_documento: "DNI",
    numero_documento: "",
    codigo_empleado: null,
    nombres: session.user.nombres,
    apellidos: session.user.apellidos,
    correo_corporativo: session.user.correo_corporativo,
    telefono: null,
    username: session.user.username,
    password_hash: "",
    requiere_cambio_clave: false,
    intentos_fallidos: 0,
    bloqueado_hasta: null,
    estado_cuenta: session.user.estado_cuenta as "ACTIVO",
    ultimo_acceso: null,
    fecha_registro: new Date().toISOString(),
    fecha_finalizacion: null,
    creado_por: null,
    updated_at: new Date().toISOString(),
  } as Usuario;

  return (
    <PermissionsProvider permissions={session.permisos}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} permissions={session.permisos} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar user={user} />
          <CommandPalette />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </PermissionsProvider>
  );
}