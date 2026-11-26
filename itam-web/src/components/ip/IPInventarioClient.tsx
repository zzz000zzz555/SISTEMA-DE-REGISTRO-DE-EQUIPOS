"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ESTADO_COLORS: Record<string, string> = {
  LIBRE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  OCUPADO: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  RESERVADO: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export function IPInventarioClient({ items: initial }: { items: any[] }) {
  const [items, setItems] = useState(initial);
  const [subred, setSubred] = useState("IP0");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    subred_tab: "IP0", octeto_4: 1, tipo_dispositivo: "", fisico_virtual: "FISICO",
    codigo_patrimonial: "", ubicacion: "", marca: "", nombre_equipo: "", usuario_windows: "",
    anydesk: "", rustdesk: "", clave_anydesk: "", personal_asignado: "", observacion: "",
    estado: "OCUPADO",
  });

  const filtered = useMemo(() => items.filter((i) =>
    i.subred_tab === subred &&
    (!search || i.ip_completa?.includes(search) || i.nombre_equipo?.toLowerCase().includes(search.toLowerCase()) ||
     i.codigo_patrimonial?.includes(search) || i.ubicacion?.toLowerCase().includes(search.toLowerCase()))
  ), [items, subred, search]);

  const ipCompleta = `172.16.${subred.replace("IP", "")}.${form.octeto_4}`;

  async function save() {
    const sb = createClient();
    const oct3 = parseInt(subred.replace("IP", ""));
    const { data } = await sb.from("ip_inventario").upsert({
      subred_tab: subred,
      octeto_1: 172, octeto_2: 16, octeto_3: oct3, octeto_4: form.octeto_4,
      ip_completa: ipCompleta,
      estado: form.estado,
      tipo_dispositivo: form.tipo_dispositivo || null,
      fisico_virtual: form.fisico_virtual,
      codigo_patrimonial: form.codigo_patrimonial || null,
      ubicacion: form.ubicacion || null,
      marca: form.marca || null,
      nombre_equipo: form.nombre_equipo || null,
      usuario_windows: form.usuario_windows || null,
      anydesk: form.anydesk || null,
      rustdesk: form.rustdesk || null,
      clave_anydesk: form.clave_anydesk || null,
      personal_asignado: form.personal_asignado || null,
      observacion: form.observacion || null,
    }, { onConflict: "octeto_1,octeto_2,octeto_3,octeto_4" }).select().single();
    if (data) {
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id_ip === data.id_ip);
        if (idx >= 0) { const n = [...prev]; n[idx] = data; return n; }
        return [data, ...prev];
      });
    }
    setModalOpen(false);
  }

  async function liberar(item: any) {
    const sb = createClient();
    await sb.from("ip_inventario").update({
      estado: "LIBRE", tipo_dispositivo: null, fisico_virtual: null, codigo_patrimonial: null,
      ubicacion: null, marca: null, nombre_equipo: null, usuario_windows: null,
      anydesk: null, rustdesk: null, clave_anydesk: null, personal_asignado: null, observacion: null,
    }).eq("id_ip", item.id_ip);
    setItems((prev) => prev.map((i) => i.id_ip === item.id_ip ? { ...i, estado: "LIBRE", tipo_dispositivo: null, nombre_equipo: null, ubicacion: null, anydesk: null, rustdesk: null } : i));
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Inventario IP — Subredes LAN</h1>
        <button onClick={() => { setForm({ subred_tab: subred, octeto_4: 1, tipo_dispositivo: "", fisico_virtual: "FISICO", codigo_patrimonial: "", ubicacion: "", marca: "", nombre_equipo: "", usuario_windows: "", anydesk: "", rustdesk: "", clave_anydesk: "", personal_asignado: "", observacion: "", estado: "OCUPADO" }); setModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Asignar IP
        </button>
      </div>

      {/* Subred tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {["IP0", "IP1", "IP2", "IP3"].map((s) => (
          <button key={s} onClick={() => setSubred(s)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${subred === s ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 dark:text-slate-400"}`}>
            {s} (172.16.{s.replace("IP", "")}.x)
          </button>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar IP, equipo, ubicación..." className="flex-1 outline-none text-sm bg-transparent dark:text-slate-100" />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 self-center">
          {filtered.filter((i) => i.estado === "OCUPADO").length} ocupadas / {filtered.filter((i) => i.estado === "LIBRE").length} libres
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2.5">IP</th>
              <th className="text-left px-3 py-2.5">Estado</th>
              <th className="text-left px-3 py-2.5">Tipo</th>
              <th className="text-left px-3 py-2.5">F/V</th>
              <th className="text-left px-3 py-2.5">C.P.</th>
              <th className="text-left px-3 py-2.5">Ubicación</th>
              <th className="text-left px-3 py-2.5">Marca</th>
              <th className="text-left px-3 py-2.5">Nombre Equipo</th>
              <th className="text-left px-3 py-2.5">Usuario</th>
              <th className="text-left px-3 py-2.5">AnyDesk</th>
              <th className="text-left px-3 py-2.5">RustDesk</th>
              <th className="text-left px-3 py-2.5">Personal</th>
              <th className="text-left px-3 py-2.5">Observación</th>
              <th className="text-right px-3 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((item) => (
              <tr key={item.id_ip} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{item.ip_completa}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${ESTADO_COLORS[item.estado] ?? "bg-slate-100 text-slate-600"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item.estado}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">{item.tipo_dispositivo ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">{item.fisico_virtual ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{item.codigo_patrimonial ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs truncate max-w-[120px]">{item.ubicacion ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">{item.marca ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">{item.nombre_equipo ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">{item.usuario_windows ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {item.anydesk ? <button onClick={() => copyText(item.anydesk)} className="hover:text-indigo-600 dark:hover:text-indigo-400" title="Copiar">{item.anydesk}</button> : "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{item.rustdesk ?? "—"}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs truncate max-w-[100px]">{item.personal_asignado ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs truncate max-w-[120px]">{item.observacion ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-0.5">
                    <button onClick={() => { setForm({ subred_tab: item.subred_tab, octeto_4: item.octeto_4, tipo_dispositivo: item.tipo_dispositivo ?? "", fisico_virtual: item.fisico_virtual ?? "FISICO", codigo_patrimonial: item.codigo_patrimonial ?? "", ubicacion: item.ubicacion ?? "", marca: item.marca ?? "", nombre_equipo: item.nombre_equipo ?? "", usuario_windows: item.usuario_windows ?? "", anydesk: item.anydesk ?? "", rustdesk: item.rustdesk ?? "", clave_anydesk: item.clave_anydesk ?? "", personal_asignado: item.personal_asignado ?? "", observacion: item.observacion ?? "", estado: item.estado }); setModalOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-indigo-600 dark:text-indigo-400" title="Editar">
                      ✏️
                    </button>
                    {item.estado !== "LIBRE" && (
                      <button onClick={() => liberar(item)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-amber-600 dark:text-amber-400" title="Liberar IP">
                        🔓
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={14} className="text-center py-8 text-slate-400">Sin registros en esta subred</td></tr>}
            {filtered.length > 100 && <tr><td colSpan={14} className="text-center py-4 text-slate-400 text-xs">Mostrando 100 de {filtered.length} registros. Use el buscador para filtrar.</td></tr>}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-3">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Asignar IP — {ipCompleta}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Subred</label>
                <select value={form.subred_tab} onChange={(e) => setForm({ ...form, subred_tab: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
                  {["IP0","IP1","IP2","IP3"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">IP Fija (1-254)</label>
                <input type="number" min={1} max={254} value={form.octeto_4} onChange={(e) => setForm({ ...form, octeto_4: Number(e.target.value) })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
                  {["LIBRE","OCUPADO","RESERVADO"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Tipo Dispositivo</label>
                <select value={form.tipo_dispositivo} onChange={(e) => setForm({ ...form, tipo_dispositivo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
                  <option value="">—</option>
                  {["CPU","IMPRESORA","SERVIDOR","SWITCH","RELOJ BIOMETRICO","OTRO"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Físico/Virtual</label>
                <select value={form.fisico_virtual} onChange={(e) => setForm({ ...form, fisico_virtual: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
                  {["FISICO","VIRTUAL"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Código Patrimonial</label>
                <input value={form.codigo_patrimonial} onChange={(e) => setForm({ ...form, codigo_patrimonial: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Ubicación</label>
                <input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Marca</label>
                <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Nombre Equipo</label>
                <input value={form.nombre_equipo} onChange={(e) => setForm({ ...form, nombre_equipo: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Usuario Windows</label>
                <input value={form.usuario_windows} onChange={(e) => setForm({ ...form, usuario_windows: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">AnyDesk</label>
                <input value={form.anydesk} onChange={(e) => setForm({ ...form, anydesk: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">RustDesk</label>
                <input value={form.rustdesk} onChange={(e) => setForm({ ...form, rustdesk: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Clave AnyDesk</label>
                <input value={form.clave_anydesk} onChange={(e) => setForm({ ...form, clave_anydesk: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Personal Asignado</label>
                <input value={form.personal_asignado} onChange={(e) => setForm({ ...form, personal_asignado: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Observación</label>
                <textarea value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">Cancelar</button>
              <button onClick={save} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}