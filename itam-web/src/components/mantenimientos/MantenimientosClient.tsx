"use client";

import { useState } from "react";
import { Plus, Eye, Pencil, Ban, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MantenimientosClient({ mantenimientos: initial, equipos }: { mantenimientos: any[]; equipos: { id_equipo: string; codigo_patrimonial: string }[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ id_equipo: "", tipo: "PREVENTIVO", falla: "", trabajo: "", costo: "", tecnico: "" });
  const [editForm, setEditForm] = useState({ falla: "", trabajo: "", costo: "", estado: "EN_PROCESO" });

  async function save() {
    const sb = createClient();
    const { data } = await sb.from("mantenimientos").insert({
      id_equipo: form.id_equipo,
      tipo_mantenimiento: form.tipo,
      descripcion_falla: form.falla,
      trabajo_realizado: form.trabajo,
      costo: form.costo ? Number(form.costo) : 0,
      id_tecnico_responsable: (await sb.from("usuarios").select("id_usuario").eq("username", "admin").single()).data?.id_usuario,
      fecha_registro: new Date().toISOString(),
      estado_servicio: "EN_PROCESO",
    }).select().single();
    if (data) setItems((x) => [data, ...x]);
    setOpen(false);
  }

  async function saveEdit() {
    if (!editItem) return;
    const sb = createClient();
    await sb.from("mantenimientos").update({
      descripcion_falla: editForm.falla,
      trabajo_realizado: editForm.trabajo,
      costo: editForm.costo ? Number(editForm.costo) : 0,
      estado_servicio: editForm.estado,
      fecha_finalizacion: editForm.estado === "FINALIZADO" ? new Date().toISOString() : null,
    }).eq("id_mantenimiento", editItem.id_mantenimiento);
    setItems((x) => x.map((m) => m.id_mantenimiento === editItem.id_mantenimiento ? { ...m, descripcion_falla: editForm.falla, trabajo_realizado: editForm.trabajo, costo: editForm.costo ? Number(editForm.costo) : 0, estado_servicio: editForm.estado } : m));
    setEditItem(null);
  }

  async function anular(m: any) {
    const sb = createClient();
    await sb.from("mantenimientos").update({ estado_servicio: "IRREPARABLE", fecha_finalizacion: new Date().toISOString() }).eq("id_mantenimiento", m.id_mantenimiento);
    setItems((x) => x.map((item) => item.id_mantenimiento === m.id_mantenimiento ? { ...item, estado_servicio: "IRREPARABLE" } : item));
  }

  async function eliminar(m: any) {
    if (!confirm("¿Eliminar este mantenimiento?")) return;
    const sb = createClient();
    await sb.from("mantenimientos").delete().eq("id_mantenimiento", m.id_mantenimiento);
    setItems((x) => x.filter((item) => item.id_mantenimiento !== m.id_mantenimiento));
  }

  const estadoColor = (e: string) => e === "FINALIZADO" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : e === "IRREPARABLE" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mantenimientos</h1>
        <button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Nuevo
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="text-left px-3 py-2.5">Equipo</th>
              <th className="text-left px-3 py-2.5">Tipo</th>
              <th className="text-left px-3 py-2.5">Falla</th>
              <th className="text-left px-3 py-2.5">Costo</th>
              <th className="text-left px-3 py-2.5">Estado</th>
              <th className="text-left px-3 py-2.5">Inicio</th>
              <th className="text-right px-3 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id_mantenimiento} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{equipos.find((e) => e.id_equipo === m.id_equipo)?.codigo_patrimonial ?? m.id_equipo}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{m.tipo_mantenimiento}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 truncate max-w-xs">{m.descripcion_falla}</td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">S/ {Number(m.costo).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${estadoColor(m.estado_servicio)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {m.estado_servicio}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{new Date(m.fecha_registro).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-0.5">
                    <button onClick={() => setViewItem(m)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Ver"><Eye size={14} /></button>
                    <button onClick={() => { setEditItem(m); setEditForm({ falla: m.descripcion_falla, trabajo: m.trabajo_realizado ?? "", costo: m.costo, estado: m.estado_servicio }); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400" title="Editar"><Pencil size={14} /></button>
                    <button onClick={() => anular(m)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-amber-600 dark:text-amber-400" title="Anular (Irreparable)"><Ban size={14} /></button>
                    <button onClick={() => eliminar(m)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-red-600 dark:text-red-400" title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">Sin mantenimientos registrados</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Nuevo Mantenimiento</h2>
            <select value={form.id_equipo} onChange={(e) => setForm({ ...form, id_equipo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
              <option value="">Equipo</option>
              {equipos.map((e) => <option key={e.id_equipo} value={e.id_equipo}>{e.codigo_patrimonial}</option>)}
            </select>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
              {["PREVENTIVO","CORRECTIVO","GARANTIA_EXTERNA","REPOTENCIACION"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <textarea placeholder="Descripción de falla" value={form.falla} onChange={(e) => setForm({ ...form, falla: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" rows={2} />
            <textarea placeholder="Trabajo realizado" value={form.trabajo} onChange={(e) => setForm({ ...form, trabajo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" rows={2} />
            <input placeholder="Costo" type="number" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={save} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-2">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Detalle de Mantenimiento</h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <div><span className="font-semibold">Equipo:</span> {equipos.find((e) => e.id_equipo === viewItem.id_equipo)?.codigo_patrimonial}</div>
              <div><span className="font-semibold">Tipo:</span> {viewItem.tipo_mantenimiento}</div>
              <div><span className="font-semibold">Falla:</span> {viewItem.descripcion_falla}</div>
              <div><span className="font-semibold">Trabajo:</span> {viewItem.trabajo_realizado ?? "—"}</div>
              <div><span className="font-semibold">Costo:</span> S/ {Number(viewItem.costo).toLocaleString()}</div>
              <div><span className="font-semibold">Estado:</span> {viewItem.estado_servicio}</div>
              <div><span className="font-semibold">Inicio:</span> {new Date(viewItem.fecha_registro).toLocaleString()}</div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewItem(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Editar Mantenimiento</h2>
            <textarea placeholder="Descripción de falla" value={editForm.falla} onChange={(e) => setEditForm({ ...editForm, falla: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" rows={2} />
            <textarea placeholder="Trabajo realizado" value={editForm.trabajo} onChange={(e) => setEditForm({ ...editForm, trabajo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" rows={2} />
            <input placeholder="Costo" type="number" value={editForm.costo} onChange={(e) => setEditForm({ ...editForm, costo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <select value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
              {["EN_PROCESO","FINALIZADO","IRREPARABLE"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={saveEdit} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}