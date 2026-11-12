"use client";

import { useState } from "react";

export function AuditoriaClient({ rows }: { rows: any[] }) {
  const [selected, setSelected] = useState<any | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Auditoría Forense</h1>
      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr><th className="text-left px-3 py-3">Fecha</th><th className="text-left px-3 py-3">Tabla</th><th className="text-left px-3 py-3">Operación</th><th className="text-left px-3 py-3">Registro</th><th className="text-left px-3 py-3">Usuario</th><th className="text-left px-3 py-3">IP</th><th className="text-right px-3 py-3">Detalle</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id_auditoria} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-500">{new Date(r.fecha_registro).toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.tabla_afectada}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.operacion === "INSERT" ? "bg-emerald-100 text-emerald-700" :
                    r.operacion === "UPDATE" ? "bg-amber-100 text-amber-700" :
                    r.operacion === "DELETE" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                  }`}>{r.operacion}</span>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.id_registro_afectado}</td>
                <td className="px-3 py-2 text-xs">{r.id_usuario_ejecutor ?? "—"}</td>
                <td className="px-3 py-2 text-xs font-mono">{r.ip_origen ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setSelected(r)} className="text-indigo-600 text-xs hover:underline">Ver diff</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Diff: {selected.tabla_afectada} · {selected.operacion}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold text-red-600 mb-2">Antes (OLD)</div>
                <pre className="bg-red-50 p-3 rounded text-xs overflow-auto max-h-96">{JSON.stringify(selected.datos_anteriores, null, 2)}</pre>
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-600 mb-2">Después (NEW)</div>
                <pre className="bg-emerald-50 p-3 rounded text-xs overflow-auto max-h-96">{JSON.stringify(selected.datos_nuevos, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}