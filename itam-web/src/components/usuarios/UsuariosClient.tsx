"use client";

import { useState } from "react";
import { Plus, Power, Eye, Pencil, Trash2, Ban, Activity, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Usuario, Rol, SesionToken } from "@/lib/types";

export function UsuariosClient({ usuarios: initial, roles, sesiones: initialSes }: { usuarios: Usuario[]; roles: Rol[]; sesiones: SesionToken[] }) {
  const [usuarios, setUsuarios] = useState(initial);
  const [sesiones, setSesiones] = useState(initialSes);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<Usuario | null>(null);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({ id_rol: 0, nombres: "", apellidos: "", correo_corporativo: "", telefono: "", estado_cuenta: "ACTIVO" as Usuario["estado_cuenta"] });
  const [form, setForm] = useState({ id_rol: 0, tipo_documento: "DNI", numero_documento: "", nombres: "", apellidos: "", correo_corporativo: "", telefono: "", username: "", password: "", password2: "" });
  const [msg, setMsg] = useState("");

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

  async function anular(u: Usuario) {
    const admin = createClient();
    await admin.from("usuarios").update({ estado_cuenta: "CESADO", fecha_finalizacion: new Date().toISOString() }).eq("id_usuario", u.id_usuario);
    setUsuarios((us) => us.map((x) => x.id_usuario === u.id_usuario ? { ...x, estado_cuenta: "CESADO", fecha_finalizacion: new Date().toISOString() } : x));
  }

  async function eliminar(u: Usuario) {
    if (!confirm("¿Eliminar permanentemente este usuario? (soft-delete recomendado)")) return;
    const admin = createClient();
    await admin.from("usuarios").update({ estado_cuenta: "CESADO", fecha_finalizacion: new Date().toISOString() }).eq("id_usuario", u.id_usuario);
    setUsuarios((us) => us.filter((x) => x.id_usuario !== u.id_usuario));
  }

  function openEdit(u: Usuario) {
    setEditUser(u);
    setEditForm({ id_rol: u.id_rol, nombres: u.nombres, apellidos: u.apellidos, correo_corporativo: u.correo_corporativo, telefono: u.telefono ?? "", estado_cuenta: u.estado_cuenta });
  }

  async function saveEdit() {
    if (!editUser) return;
    const sb = createClient();
    await sb.from("usuarios").update({
      id_rol: editForm.id_rol,
      nombres: editForm.nombres,
      apellidos: editForm.apellidos,
      correo_corporativo: editForm.correo_corporativo,
      telefono: editForm.telefono || null,
      estado_cuenta: editForm.estado_cuenta,
      fecha_finalizacion: editForm.estado_cuenta === "CESADO" ? new Date().toISOString() : null,
    }).eq("id_usuario", editUser.id_usuario);
    setUsuarios((us) => us.map((x) => x.id_usuario === editUser.id_usuario ? { ...x, ...editForm } : x));
    setEditUser(null);
  }

  async function killUserSessions(u: Usuario) {
    const sb = createClient();
    await sb.from("sesiones_tokens").update({ estado_sesion: "REVOCADA_ADMIN", fecha_finalizacion: new Date().toISOString(), motivo_cierre: "Sesiones cerradas por administrador" }).eq("id_usuario", u.id_usuario).eq("estado_sesion", "ACTIVA");
    setSesiones((ss) => ss.map((x) => x.id_usuario === u.id_usuario && x.estado_sesion === "ACTIVA" ? { ...x, estado_sesion: "REVOCADA_ADMIN" } : x));
  }

  async function saveUser() {
    setMsg("");
    if (form.password !== form.password2) { setMsg("Las contraseñas no coinciden"); return; }
    if (form.password.length < 6) { setMsg("La contraseña debe tener al menos 6 caracteres"); return; }
    const sb = createClient();
    const codigoEmpleado = "EMP-" + Date.now().toString().slice(-6);
    const { data, error } = await sb.rpc("fn_crear_usuario", {
      p_id_rol: form.id_rol,
      p_tipo_documento: form.tipo_documento,
      p_numero_documento: form.numero_documento,
      p_nombres: form.nombres,
      p_apellidos: form.apellidos,
      p_correo_corporativo: form.correo_corporativo,
      p_username: form.username,
      p_password: form.password,
      p_codigo_empleado: codigoEmpleado,
      p_telefono: form.telefono || null,
    });
    const res = data as { ok: boolean; mensaje: string; id_usuario?: string };
    if (error || !res?.ok) {
      setMsg(res?.mensaje || error?.message || "Error al crear usuario");
      return;
    }
    setMsg(res.mensaje);
    const { data: fresh } = await sb.from("usuarios").select("*").order("id_usuario");
    if (fresh) setUsuarios(fresh as Usuario[]);
    setModalOpen(false);
    setForm({ id_rol: 0, tipo_documento: "DNI", numero_documento: "", nombres: "", apellidos: "", correo_corporativo: "", telefono: "", username: "", password: "", password2: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Usuarios y Sesiones</h1>
        <button onClick={() => setModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {msg && <div className="text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 p-2 rounded">{msg}</div>}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200">Usuarios</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
              <tr key={u.id_usuario} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{u.username}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.nombres} {u.apellidos}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{roles.find((r) => r.id_rol === u.id_rol)?.nombre_rol ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.estado_cuenta === "ACTIVO" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                    {u.estado_cuenta}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString() : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => setViewUser(u)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300" title="Ver detalle"><Eye size={15} /></button>
                    <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400" title="Editar"><Pencil size={15} /></button>
                    <button onClick={() => toggleEstado(u)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300" title="Activar/Suspender"><Power size={15} /></button>
                    <button onClick={() => killUserSessions(u)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-orange-600 dark:text-orange-400" title="Cerrar sesiones"><LogOut size={15} /></button>
                    <button onClick={() => anular(u)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-amber-600 dark:text-amber-400" title="Anular"><Ban size={15} /></button>
                    <button onClick={() => eliminar(u)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-red-600 dark:text-red-400" title="Eliminar"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200">Sesiones Activas</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
              <tr key={s.id_sesion} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{usuarios.find((u) => u.id_usuario === s.id_usuario)?.username ?? s.id_usuario}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{s.ip_origen}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs">{s.agente_navegador}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.dispositivo}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(s.fecha_registro).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.estado_sesion === "ACTIVA" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {s.estado_sesion}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {s.estado_sesion === "ACTIVA" && (
                    <button onClick={() => revocar(s)} className="text-red-600 dark:text-red-400 text-xs hover:underline">Revocar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Nuevo Usuario</h2>
            <select value={form.id_rol} onChange={(e) => setForm({ ...form, id_rol: Number(e.target.value) })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
              <option value={0}>Rol</option>
              {roles.map((r) => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={form.tipo_documento} onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })} className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
                {["DNI","CE","PASAPORTE","RUC"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <input placeholder="N° Documento" value={form.numero_documento} onChange={(e) => setForm({ ...form, numero_documento: e.target.value })} className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nombres" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            </div>
            <input placeholder="Correo corporativo" value={form.correo_corporativo} onChange={(e) => setForm({ ...form, correo_corporativo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Teléfono (opcional)" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <input type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <input type="password" placeholder="Confirmar contraseña" value={form.password2} onChange={(e) => setForm({ ...form, password2: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <div className="text-xs text-slate-500 dark:text-slate-400">El código de empleado se genera automáticamente.</div>
            {msg && <div className="text-sm text-red-600 dark:text-red-400">{msg}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={saveUser} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Editar Usuario</h2>
            <select value={editForm.id_rol} onChange={(e) => setEditForm({ ...editForm, id_rol: Number(e.target.value) })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
              {roles.map((r) => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nombres" value={editForm.nombres} onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })} className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Apellidos" value={editForm.apellidos} onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })} className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            </div>
            <input placeholder="Correo corporativo" value={editForm.correo_corporativo} onChange={(e) => setEditForm({ ...editForm, correo_corporativo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Teléfono" value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <select value={editForm.estado_cuenta} onChange={(e) => setEditForm({ ...editForm, estado_cuenta: e.target.value as Usuario["estado_cuenta"] })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
              {["ACTIVO","SUSPENDIDO","CESADO","BLOQUEADO"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={saveEdit} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-2">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Detalle de Usuario</h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <div><span className="font-semibold">Username:</span> {viewUser.username}</div>
              <div><span className="font-semibold">Nombre:</span> {viewUser.nombres} {viewUser.apellidos}</div>
              <div><span className="font-semibold">Correo:</span> {viewUser.correo_corporativo}</div>
              <div><span className="font-semibold">Rol:</span> {roles.find((r) => r.id_rol === viewUser.id_rol)?.nombre_rol}</div>
              <div><span className="font-semibold">Estado:</span> {viewUser.estado_cuenta}</div>
              <div><span className="font-semibold">Documento:</span> {viewUser.tipo_documento} {viewUser.numero_documento}</div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewUser(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}