"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Eye, Pencil, Ban, Trash2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Pagination, usePagination } from "@/components/ui/Pagination";

export function MantenimientosClient({ mantenimientos: initial, equipos, usuarios }: { mantenimientos: any[]; equipos: { id_equipo: string; codigo_patrimonial: string }[]; usuarios: { id_usuario: string; username: string; nombres: string; apellidos: string }[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ id_equipo: "", tipo: "PREVENTIVO", falla: "", trabajo: "", tecnico: "" });
  const [editForm, setEditForm] = useState({ falla: "", trabajo: "", estado: "EN_PROCESO" });

  async function save() {
    const sb = createClient();
    const { data } = await sb.from("mantenimientos").insert({
      ...(form.id_equipo ? { id_equipo: form.id_equipo } : {}),
      tipo_mantenimiento: form.tipo,
      descripcion_falla: form.falla,
      trabajo_realizado: form.trabajo,
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
      estado_servicio: editForm.estado,
      fecha_finalizacion: editForm.estado === "FINALIZADO" ? new Date().toISOString() : null,
    }).eq("id_mantenimiento", editItem.id_mantenimiento);
    setItems((x) => x.map((m) => m.id_mantenimiento === editItem.id_mantenimiento ? { ...m, descripcion_falla: editForm.falla, trabajo_realizado: editForm.trabajo, estado_servicio: editForm.estado } : m));
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

  const estadoColor = (e: string) => {
    const v = String(e ?? "").toUpperCase();
    if (["FINALIZADO", "BUENO", "OPERATIVO"].includes(v)) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    if (["IRREPARABLE", "MALO", "INOPERATIVO", "BAJA"].includes(v)) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  };

  const equipoCP = (m: any) => m.codigo_patrimonial ?? equipos.find((e) => e.id_equipo === m.id_equipo)?.codigo_patrimonial ?? m.id_equipo ?? "—";
  const tecnicoNombre = (m: any) => usuarios.find((u) => u.id_usuario === m.id_tecnico_responsable)?.username ?? m.responsable_bien ?? "—";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => {
      const equipo = m.codigo_patrimonial ?? equipos.find((e) => e.id_equipo === m.id_equipo)?.codigo_patrimonial ?? "";
      const tecnico = usuarios.find((u) => u.id_usuario === m.id_tecnico_responsable)?.username ?? m.responsable_bien ?? "";
      return [equipo, tecnico, m.sede, m.denominacion, m.tipo_mantenimiento, m.descripcion_falla, m.trabajo_realizado, m.estado_servicio]
        .some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [items, equipos, usuarios, search]);

  const { page, setPage, pageSize, setPageSize, totalPages, start, end, paged, total } = usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [search, setPage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mantenimientos</h1>
        <button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Nuevo
        </button>
      </div>
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-700">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por equipo, técnico, falla o estado..."
            className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
          />
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="text-left px-3 py-2.5 w-14">#</th>
                <th className="text-left px-3 py-2.5">Equipo</th>
                <th className="text-left px-3 py-2.5">Técnico</th>
                <th className="text-left px-3 py-2.5">Tipo</th>
                <th className="text-left px-3 py-2.5">Falla</th>
                <th className="text-left px-3 py-2.5">Estado</th>
                <th className="text-left px-3 py-2.5">Inicio</th>
                <th className="text-right px-3 py-2.5">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((m, idx) => (
                <tr key={m.id_mantenimiento} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500" title={`ID: ${m.id_mantenimiento}`}>{start + idx + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300" title={m.sede ? `${m.sede} · ${m.denominacion ?? ""}` : undefined}>{equipoCP(m)}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{tecnicoNombre(m)}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{m.tipo_mantenimiento}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 truncate max-w-xs">{m.descripcion_falla}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${estadoColor(m.estado_servicio)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {m.estado_servicio}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{m.fecha_registro ? new Date(m.fecha_registro).toLocaleDateString("es-PE") : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-0.5">
                      <button onClick={() => setViewItem(m)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Ver"><Eye size={14} /></button>
                      <button onClick={() => { setEditItem(m); setEditForm({ falla: m.descripcion_falla, trabajo: m.trabajo_realizado ?? "", estado: m.estado_servicio }); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400" title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => anular(m)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-amber-600 dark:text-amber-400" title="Anular (Irreparable)"><Ban size={14} /></button>
                      <button onClick={() => eliminar(m)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-red-600 dark:text-red-400" title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-400">Sin mantenimientos registrados</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          start={start}
          end={end}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
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
              <div><span className="font-semibold">Equipo:</span> {equipoCP(viewItem)} {viewItem.denominacion ? `· ${viewItem.denominacion}` : ""}</div>
              <div><span className="font-semibold">Sede:</span> {viewItem.sede ?? "—"}</div>
              <div><span className="font-semibold">Responsable:</span> {tecnicoNombre(viewItem)}</div>
              <div><span className="font-semibold">Tipo:</span> {viewItem.tipo_mantenimiento}</div>
              <div><span className="font-semibold">Falla:</span> {viewItem.descripcion_falla}</div>
              <div><span className="font-semibold">Trabajo:</span> {viewItem.trabajo_realizado ?? "—"}</div>
              <div><span className="font-semibold">Observación:</span> {viewItem.sugerencia_observacion ?? "—"}</div>
              <div><span className="font-semibold">AnyDesk:</span> {viewItem.anydesk_teamviewer ?? "—"}</div>
              <div><span className="font-semibold">Estado:</span> {viewItem.estado_servicio}</div>
              <div><span className="font-semibold">Inicio:</span> {viewItem.fecha_registro ? new Date(viewItem.fecha_registro).toLocaleString() : "—"}</div>
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
            <select value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
              {Array.from(new Set(["EN_PROCESO","FINALIZADO","IRREPARABLE", editForm.estado].filter(Boolean))).map((s) => <option key={s}>{s}</option>)}
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
