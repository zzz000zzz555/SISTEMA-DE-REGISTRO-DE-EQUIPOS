"use client";

import { useState } from "react";
import { Plus, Power } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Usuario, Rol, SesionToken } from "@/lib/types";

export function UsuariosClient({ usuarios: initial, roles, sesiones: initialSes }: { usuarios: Usuario[]; roles: Rol[]; sesiones: SesionToken[] }) {
  const [usuarios, setUsuarios] = useState(initial);
  const [sesiones, setSesiones] = useState(initialSes);

  async function revocar(s: SesionToken) {
    const admin = createClient();
    await admin.from("sesiones_tokens").update({ estado_sesion: "REVOCADA_ADMIN", fecha_finalizacion: new Date().toISOString(), motivo_cierre: "Revocado por seguridad" }).eq("id_sesion", s.id_sesion);
    setSesiones((ss) => ss.map((x) => x.id_sesion === s.id_sesion ? { ...x, estado_sesion: "REVOCADA_ADMIN" } : x));
  }

  async function toggleEstado(u: Usuario) {
    const admin = createClient();
    const nuevo = u.estado_cuenta === "ACTIVO" ? "SUSPENDIDO" : "ACTIVO";
    await admin.from("usuarios").update({ estado_cuenta: nuevo }).eq("id_usuario", u.id_usuario);
    setUsuarios((us) => us.map((x) => x.id_usuario === u.id_usuario ? { ...x, estado_cuenta: nuevo as Usuario["estado_cuenta"] } : x));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Usuarios y Sesiones</h1>

      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b font-semibold text-slate-700 dark:text-slate-300">Usuarios</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
            <tr>
              <th className="text-left px-4 py-3">Usuario</th>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Rol</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Último acceso</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id_usuario} className="border-t">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.nombres} {u.apellidos}</td>
                <td className="px-4 py-3">{roles.find((r) => r.id_rol === u.id_rol)?.nombre_rol ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.estado_cuenta === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {u.estado_cuenta}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString() : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleEstado(u)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Activar/Suspender"><Power size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b font-semibold text-slate-700 dark:text-slate-300">Sesiones Activas</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
            <tr>
              <th className="text-left px-4 py-3">Usuario</th>
              <th className="text-left px-4 py-3">IP</th>
              <th className="text-left px-4 py-3">Navegador</th>
              <th className="text-left px-4 py-3">Dispositivo</th>
              <th className="text-left px-4 py-3">Inicio</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.map((s) => (
              <tr key={s.id_sesion} className="border-t">
                <td className="px-4 py-3">{usuarios.find((u) => u.id_usuario === s.id_usuario)?.username ?? s.id_usuario}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.ip_origen}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">{s.agente_navegador}</td>
                <td className="px-4 py-3">{s.dispositivo}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(s.fecha_registro).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.estado_sesion === "ACTIVA" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                    {s.estado_sesion}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {s.estado_sesion === "ACTIVA" && (
                    <button onClick={() => revocar(s)} className="text-red-600 text-xs hover:underline">Revocar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

