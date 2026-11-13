"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PermissionGuard } from "@/lib/permissions-context";

export default function AuditoriaSesionesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const sb = createClient();
    sb.from("auditoria_sesiones").select("*").order("fecha_hora_inicio", { ascending: false }).limit(200)
      .then(({ data }) => { setRows(data ?? []); setLoading(false); });
  }, []);
  return (
    <PermissionGuard permiso="VER_AUDITORIA_SESIONES" fallback={<div className="text-slate-500 dark:text-slate-400">No tienes permiso para ver la auditoría de sesiones.</div>}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Auditoría de Sesiones y Accesos</h1>
        {loading ? <div className="text-slate-400">Cargando...</div> : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="text-left px-3 py-3">Usuario</th>
                  <th className="text-left px-3 py-3">IP Pública</th>
                  <th className="text-left px-3 py-3">Ubicación</th>
                  <th className="text-left px-3 py-3">SO / Navegador</th>
                  <th className="text-left px-3 py-3">Dispositivo</th>
                  <th className="text-left px-3 py-3">Inicio</th>
                  <th className="text-left px-3 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id_sesion_audit} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-mono text-xs">{r.id_usuario}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.ip_publica}</td>
                    <td className="px-3 py-2">{r.ciudad}, {r.region}, {r.pais}</td>
                    <td className="px-3 py-2 text-xs">{r.so_navegador}</td>
                    <td className="px-3 py-2">{r.dispositivo}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{new Date(r.fecha_hora_inicio).toLocaleString()}</td>
                    <td className="px-3 py-2">{r.estado}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">Sin registros</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
