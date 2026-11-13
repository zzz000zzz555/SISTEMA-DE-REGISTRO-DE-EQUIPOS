"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PermissionGuard } from "@/lib/permissions-context";
import { Activity, XCircle } from "lucide-react";

export default function MonitorPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  async function load() {
    const sb = createClient();
    const [{ data: s }, { data: u }] = await Promise.all([
      sb.from("sesiones_tokens").select("*").order("fecha_registro", { ascending: false }).limit(100),
      sb.from("usuarios").select("id_usuario,username,nombres,apellidos"),
    ]);
    setSessions(s ?? []);
    setUsers(u ?? []);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  async function kill(s: any) {
    const sb = createClient();
    await sb.from("sesiones_tokens").update({ estado_sesion: "REVOCADA_ADMIN", fecha_finalizacion: new Date().toISOString(), motivo_cierre: "Kill forzado por administrador" }).eq("id_sesion", s.id_sesion);
    setSessions((prev) => prev.map((x) => x.id_sesion === s.id_sesion ? { ...x, estado_sesion: "REVOCADA_ADMIN" } : x));
  }

  return (
    <PermissionGuard permiso="VER_AUDITORIA_SESIONES" fallback={<div className="text-slate-500">No tienes permiso para monitorear usuarios.</div>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity size={22} /> Monitor de Actividad en Tiempo Real
          </h1>
          <span className="text-xs text-slate-500 dark:text-slate-400">Actualización cada 10s</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="text-left px-4 py-3">Usuario</th>
                <th className="text-left px-4 py-3">IP</th>
                <th className="text-left px-4 py-3">Navegador / SO</th>
                <th className="text-left px-4 py-3">Dispositivo</th>
                <th className="text-left px-4 py-3">Inicio</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const u = users.find((x) => x.id_usuario === s.id_usuario);
                return (
                  <tr key={s.id_sesion} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium">{u?.username ?? s.id_usuario}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{s.ip_origen}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">{s.agente_navegador}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.dispositivo}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(s.fecha_registro).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.estado_sesion === "ACTIVA" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                        {s.estado_sesion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.estado_sesion === "ACTIVA" && (
                        <button onClick={() => kill(s)} className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs hover:underline font-semibold">
                          <XCircle size={14} /> Kill
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sessions.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">Sin sesiones</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGuard>
  );
}