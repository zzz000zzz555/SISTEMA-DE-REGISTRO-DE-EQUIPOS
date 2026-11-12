"use client";

import { useState, useMemo } from "react";
import { Plus, Search, MoreVertical, Edit2, Copy, Power, Download } from "lucide-react";
import { exportToExcel } from "@/lib/excel";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Rol, Modulo, Permiso } from "@/lib/types";
import { PermissionTree } from "./PermissionTree";

type RP = { id_rol: number; id_permiso: number };

export function RolesClient({
  roles: initialRoles,
  modulos,
  permisos,
  rolePermisos: initialRP,
}: {
  roles: Rol[];
  modulos: Modulo[];
  permisos: Permiso[];
  rolePermisos: RP[];
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [rp, setRp] = useState(initialRP);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rol | null>(null);
  const [titulo, setTitulo] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());
  const [permSearch, setPermSearch] = useState("");

  const filtered = useMemo(() => {
    return roles.filter((r) => {
      const matchSearch = !search || r.nombre_rol.toLowerCase().includes(search.toLowerCase()) || (r.descripcion ?? "").toLowerCase().includes(search.toLowerCase());
      const matchFiltro = filtro === "TODOS" || (filtro === "ACTIVO" ? r.activo : !r.activo);
      return matchSearch && matchFiltro;
    });
  }, [roles, search, filtro]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openNew() {
    setEditing(null);
    setTitulo("");
    setSelectedPerms(new Set());
    setModalOpen(true);
  }

  function openEdit(r: Rol) {
    setEditing(r);
    setTitulo(r.nombre_rol);
    const s = new Set(rp.filter((x) => x.id_rol === r.id_rol).map((x) => x.id_permiso));
    setSelectedPerms(s);
    setModalOpen(true);
  }

  async function save() {
    const admin = createAdminClient();
    if (editing) {
      await admin.from("roles").update({ nombre_rol: titulo.toUpperCase() }).eq("id_rol", editing.id_rol);
      await admin.from("roles_permisos").delete().eq("id_rol", editing.id_rol);
      if (selectedPerms.size) {
        await admin.from("roles_permisos").insert(
          [...selectedPerms].map((pid) => ({ id_rol: editing.id_rol, id_permiso: pid, activo: true }))
        );
      }
      setRoles((rs) => rs.map((r) => (r.id_rol === editing.id_rol ? { ...r, nombre_rol: titulo.toUpperCase() } : r)));
      setRp((prev) => [...prev.filter((x) => x.id_rol !== editing.id_rol), ...[...selectedPerms].map((pid) => ({ id_rol: editing.id_rol, id_permiso: pid }))]);
    } else {
      const { data } = await admin.from("roles").insert({ nombre_rol: titulo.toUpperCase(), nivel_jerarquia: 10 }).select().single();
      if (data) {
        const newRol = data as Rol;
        setRoles((rs) => [...rs, newRol]);
        if (selectedPerms.size) {
          await admin.from("roles_permisos").insert([...selectedPerms].map((pid) => ({ id_rol: newRol.id_rol, id_permiso: pid, activo: true })));
          setRp((prev) => [...prev, ...[...selectedPerms].map((pid) => ({ id_rol: newRol.id_rol, id_permiso: pid }))]);
        }
      }
    }
    setModalOpen(false);
  }

  async function toggleActivo(r: Rol) {
    const admin = createAdminClient();
    const nuevo = !r.activo;
    await admin.from("roles").update({ activo: nuevo, fecha_finalizacion: nuevo ? null : new Date().toISOString() }).eq("id_rol", r.id_rol);
    setRoles((rs) => rs.map((x) => (x.id_rol === r.id_rol ? { ...x, activo: nuevo } : x)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Roles</h1>
        <button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Nuevo
        </button>
        <button onClick={() => exportToExcel({
          title: "Gestión de Roles",
          exportedBy: "admin",
          columns: [
            { header: "ID", key: "id_rol", width: 8 },
            { header: "Rol", key: "nombre_rol", width: 30 },
            { header: "Descripción", key: "descripcion", width: 40 },
            { header: "Nivel", key: "nivel_jerarquia", width: 8 },
            { header: "Estado", key: "activo", width: 10 },
          ],
          rows: filtered.map((r) => ({ ...r, activo: r.activo ? "ACTIVO" : "ANULADO" })) as Record<string, unknown>[],
          summary: [{ label: "Total roles", value: filtered.length }],
          filename: "roles.xlsx",
        })} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Download size={16} /> Exportar Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 flex-1 max-w-md">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === "Enter") setPage(1); }}
              placeholder="Ingrese una descripción y presione Enter"
              className="flex-1 outline-none text-sm"
            />
          </div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value="TODOS">TODOS</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="ANULADO">ANULADO</option>
          </select>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded-lg px-3 py-1.5 text-sm">
            <option value={10}>Mostrar 10</option>
            <option value={25}>Mostrar 25</option>
            <option value={50}>Mostrar 50</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Título</th>
                <th className="text-left px-4 py-3">Descripción</th>
                <th className="text-left px-4 py-3">Nivel</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id_rol} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{r.nombre_rol}</td>
                  <td className="px-4 py-3 text-slate-500">{r.descripcion ?? "—"}</td>
                  <td className="px-4 py-3">{r.nivel_jerarquia}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.activo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {r.activo ? "ACTIVO" : "ANULADO"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-slate-100 rounded" title="Editar"><Edit2 size={15} /></button>
                      <button onClick={() => toggleActivo(r)} className="p-1.5 hover:bg-slate-100 rounded" title="Activar/Anular"><Power size={15} /></button>
                      <button className="p-1.5 hover:bg-slate-100 rounded" title="Más"><MoreVertical size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex items-center justify-between text-sm text-slate-500">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Anterior</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">{editing ? "Editar Rol" : "Nuevo Rol"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-4 flex gap-2">
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="TÍTULO"
                className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase"
              />
              <button onClick={save} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium">GUARDAR</button>
            </div>
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
                <Search size={16} className="text-slate-400" />
                <input value={permSearch} onChange={(e) => setPermSearch(e.target.value)} placeholder="Buscar permisos..." className="flex-1 outline-none text-sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <PermissionTree
                modulos={modulos}
                permisos={permisos}
                selected={selectedPerms}
                onChange={setSelectedPerms}
                search={permSearch}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}