"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MantenimientosClient({ mantenimientos: initial, equipos }: { mantenimientos: any[]; equipos: { id_equipo: string; codigo_patrimonial: string }[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id_equipo: "", tipo: "PREVENTIVO", falla: "", trabajo: "", costo: "", tecnico: "" });

  async function save() {
    const admin = createClient();
    const { data } = await admin.from("mantenimientos").insert({
      id_equipo: form.id_equipo,
      tipo_mantenimiento: form.tipo,
      descripcion_falla: form.falla,
      trabajo_realizado: form.trabajo,
      costo: form.costo ? Number(form.costo) : 0,
      id_tecnico_responsable: (await admin.from("usuarios").select("id_usuario").eq("username", "admin").single()).data?.id_usuario,
      fecha_registro: new Date().toISOString(),
      estado_servicio: "EN_PROCESO",
    }).select().single();
    if (data) setItems((x) => [data, ...x]);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Mantenimientos</h1>
        <button onClick={() => setOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Plus size={16} /> Nuevo</button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950"><tr><th className="text-left px-3 py-3">Equipo</th><th className="text-left px-3 py-3">Tipo</th><th className="text-left px-3 py-3">Falla</th><th className="text-left px-3 py-3">Costo</th><th className="text-left px-3 py-3">Estado</th><th className="text-left px-3 py-3">Inicio</th></tr></thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id_mantenimiento} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{equipos.find((e) => e.id_equipo === m.id_equipo)?.codigo_patrimonial ?? m.id_equipo}</td>
                <td className="px-3 py-2">{m.tipo_mantenimiento}</td>
                <td className="px-3 py-2 truncate max-w-xs">{m.descripcion_falla}</td>
                <td className="px-3 py-2">S/ {Number(m.costo).toLocaleString()}</td>
                <td className="px-3 py-2">{m.estado_servicio}</td>
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{new Date(m.fecha_registro).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
            <h2 className="font-bold text-lg">Nuevo Mantenimiento</h2>
            <select value={form.id_equipo} onChange={(e) => setForm({ ...form, id_equipo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Equipo</option>
              {equipos.map((e) => <option key={e.id_equipo} value={e.id_equipo}>{e.codigo_patrimonial}</option>)}
            </select>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {["PREVENTIVO","CORRECTIVO","GARANTIA_EXTERNA","REPOTENCIACION"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <textarea placeholder="Descripción de falla" value={form.falla} onChange={(e) => setForm({ ...form, falla: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            <textarea placeholder="Trabajo realizado" value={form.trabajo} onChange={(e) => setForm({ ...form, trabajo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            <input placeholder="Costo" type="number" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              <button onClick={save} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

