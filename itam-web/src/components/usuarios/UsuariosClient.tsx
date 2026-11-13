"use client";

import { useState } from "react";
import { Plus, Power } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Usuario, Rol, SesionToken } from "@/lib/types";

export function UsuariosClient({ usuarios: initial, roles, sesiones: initialSes }: { usuarios: Usuario[]; roles: Rol[]; sesiones: SesionToken[] }) {
  const [usuarios, setUsuarios] = useState(initial);
  const [sesiones, setSesiones] = useState(initialSes);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id_rol: 0, tipo_documento: "DNI", numero_documento: "", codigo_empleado: "", nombres: "", apellidos: "", correo_corporativo: "", telefono: "", username: "", password: "" });
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

  async function saveUser() {
    setMsg("");
    const sb = createClient();
    const { data, error } = await sb.rpc("fn_crear_usuario", {
      p_id_rol: form.id_rol,
      p_tipo_documento: form.tipo_documento,
      p_numero_documento: form.numero_documento,
      p_nombres: form.nombres,
      p_apellidos: form.apellidos,
      p_correo_corporativo: form.correo_corporativo,
      p_username: form.username,
      p_password: form.password,
      p_codigo_empleado: form.codigo_empleado || null,
      p_telefono: form.telefono || null,
    });
    const res = data as { ok: boolean; mensaje: string; id_usuario?: string };
    if (error || !res?.ok) {
      setMsg(res?.mensaje || error?.message || "Error al crear usuario");
      return;
    }
    setMsg(res.mensaje);
    // refresh list
    const { data: fresh } = await sb.from("usuarios").select("*").order("id_usuario");
    if (fresh) setUsuarios(fresh as Usuario[]);
    setModalOpen(false);
    setForm({ id_rol: 0, tipo_documento: "DNI", numero_documento: "", codigo_empleado: "", nombres: "", apellidos: "", correo_corporativo: "", telefono: "", username: "", password: "" });
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
                  <button onClick={() => toggleEstado(u)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300" title="Activar/Suspender"><Power size={15} /></button>
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
            <input placeholder="Código empleado (opcional)" value={form.codigo_empleado} onChange={(e) => setForm({ ...form, codigo_empleado: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nombres" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            </div>
            <input placeholder="Correo corporativo" value={form.correo_corporativo} onChange={(e) => setForm({ ...form, correo_corporativo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Teléfono (opcional)" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <input type="password" placeholder="Contraseña (min 6, letras+números+especial)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={saveUser} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}