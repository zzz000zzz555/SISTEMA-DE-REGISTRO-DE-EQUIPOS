"use client";

import { useState } from "react";
import { Plus, Search, Pencil, X, GripVertical } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Modulo, Permiso } from "@/lib/types";

export function ModulosClient({ modulos: initialModulos, permisos: initialPermisos }: { modulos: Modulo[]; permisos: Permiso[] }) {
  const [modulos, setModulos] = useState(initialModulos);
  const [permisos, setPermisos] = useState(initialPermisos);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", codigo: "", link: "", icono: "", orden: 1 });
  const [actionModal, setActionModal] = useState<{ moduloId: number } | null>(null);
  const [actionForm, setActionForm] = useState({ codigo: "", nombre: "", accion: "VER" });

  const filtered = modulos.filter((m) => m.nombre_modulo.toLowerCase().includes(search.toLowerCase()) || m.codigo_modulo.toLowerCase().includes(search.toLowerCase()));

  async function saveModulo() {
    const admin = createAdminClient();
    const { data } = await admin.from("modulos_sistema").insert({
      codigo_modulo: form.codigo.toUpperCase(),
      nombre_modulo: form.nombre.toUpperCase(),
      ruta_endpoint: form.link,
      icono: form.icono,
      orden_visual: form.orden,
      activo: true,
    }).select().single();
    if (data) setModulos((ms) => [...ms, data as Modulo]);
    setModalOpen(false);
    setForm({ nombre: "", codigo: "", link: "", icono: "", orden: 1 });
  }

  async function saveAccion() {
    if (!actionModal) return;
    const admin = createAdminClient();
    const { data } = await admin.from("permisos").insert({
      id_modulo: actionModal.moduloId,
      codigo_permiso: actionForm.codigo.toUpperCase(),
      nombre_permiso: actionForm.nombre,
      accion: actionForm.accion,
    }).select().single();
    if (data) setPermisos((ps) => [...ps, data as Permiso]);
    setActionModal(null);
    setActionForm({ codigo: "", nombre: "", accion: "VER" });
  }

  async function deleteAccion(id: number) {
    const admin = createAdminClient();
    await admin.from("permisos").delete().eq("id_permiso", id);
    setPermisos((ps) => ps.filter((p) => p.id_permiso !== id));
  }

  async function toggleModulo(m: Modulo) {
    const admin = createAdminClient();
    await admin.from("modulos_sistema").update({ activo: !m.activo, fecha_finalizacion: m.activo ? new Date().toISOString() : null }).eq("id_modulo", m.id_modulo);
    setModulos((ms) => ms.map((x) => x.id_modulo === m.id_modulo ? { ...x, activo: !m.activo } : x));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Módulos</h1>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 flex-1">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="BUSCAR MÓDULO..." className="flex-1 outline-none text-sm uppercase" />
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white w-9 h-9 rounded-lg flex items-center justify-center">
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => (
          <div key={m.id_modulo} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">{m.nombre_modulo}</div>
                <div className="text-xs text-slate-500">Link: {m.ruta_endpoint}</div>
              </div>
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-slate-300" />
                <button onClick={() => toggleModulo(m)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Pencil size={15} /></button>
                <button onClick={() => toggleModulo(m)} className="p-1.5 hover:bg-slate-100 rounded text-red-500"><X size={15} /></button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              {permisos.filter((p) => p.id_modulo === m.id_modulo).map((p) => (
                <span key={p.id_permiso} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-medium">
                  {p.nombre_permiso}
                  <button className="hover:text-indigo-900"><Pencil size={11} /></button>
                  <button onClick={() => deleteAccion(p.id_permiso)} className="hover:text-red-600"><X size={11} /></button>
                </span>
              ))}
              <button
                onClick={() => setActionModal({ moduloId: m.id_modulo })}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1"
              >
                <Plus size={12} /> Nueva acción
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3">
            <h2 className="font-bold text-lg">Nuevo Módulo</h2>
            <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Código (ej. MOD_X)" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Link/Endpoint" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Icono" value={form.icono} onChange={(e) => setForm({ ...form, icono: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Orden" value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              <button onClick={saveModulo} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3">
            <h2 className="font-bold text-lg">Nueva Acción</h2>
            <input placeholder="Código (ej. EQUIPOS_VER)" value={actionForm.codigo} onChange={(e) => setActionForm({ ...actionForm, codigo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Nombre permiso" value={actionForm.nombre} onChange={(e) => setActionForm({ ...actionForm, nombre: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <select value={actionForm.accion} onChange={(e) => setActionForm({ ...actionForm, accion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              {["VER","CREAR","EDITAR","ELIMINAR","ANULAR","EXPORTAR","APROBAR"].map((a) => <option key={a}>{a}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setActionModal(null)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              <button onClick={saveAccion} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}