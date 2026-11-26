"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Download, QrCode, Printer, Monitor, FileText, Eye, Pencil, Ban, Trash2 } from "lucide-react";
import { exportToExcel } from "@/lib/excel";
import { BarcodeLabel } from "./BarcodeLabel";
import { WorkstationTree } from "./WorkstationTree";
import { ActaCargo } from "./ActaCargo";
import { createClient } from "@/lib/supabase/client";
import type { InventarioView, Categoria, Marca, Modelo, Color, TipoEquipo, EstadoOperativo, Ubicacion } from "@/lib/types";

const SPEC_FIELDS: Record<string, { key: string; label: string; type?: string }[]> = {
  "Pantalla/Monitor": [
    { key: "pulgadas", label: "Pulgadas", type: "number" },
    { key: "panel", label: "Panel" },
    { key: "resolucion", label: "Resolución" },
    { key: "tasa_refresco_hz", label: "Tasa refresco (Hz)", type: "number" },
  ],
  "PC/Workstation": [
    { key: "ram_gb", label: "RAM (GB)", type: "number" },
    { key: "procesador", label: "Procesador" },
    { key: "almacenamiento", label: "Almacenamiento" },
    { key: "gpu", label: "GPU" },
  ],
  "Teclado": [
    { key: "tipo_switch", label: "Tipo switch" },
    { key: "retroiluminacion", label: "Retroiluminación", type: "checkbox" },
    { key: "inalambrico", label: "Inalámbrico", type: "checkbox" },
  ],
  "Impresora": [
    { key: "tipo_impresion", label: "Tipo impresión" },
    { key: "velocidad_ppm", label: "Velocidad (ppm)", type: "number" },
    { key: "multifuncional", label: "Multifuncional", type: "checkbox" },
  ],
  "Parlantes": [
    { key: "potencia_w", label: "Potencia (W)", type: "number" },
    { key: "conectividad", label: "Conectividad" },
    { key: "subwoofer", label: "Subwoofer", type: "checkbox" },
  ],
  "Audífonos": [
    { key: "tipo", label: "Tipo" },
    { key: "microfono", label: "Micrófono", type: "checkbox" },
    { key: "inalambrico", label: "Inalámbrico", type: "checkbox" },
    { key: "conector", label: "Conector" },
  ],
  Mouse: [
    { key: "dpi", label: "DPI", type: "number" },
    { key: "botones", label: "Botones", type: "number" },
    { key: "inalambrico", label: "Inalámbrico", type: "checkbox" },
  ],
};

export function EquiposClient(props: {
  inventario: InventarioView[];
  categorias: Categoria[];
  marcas: Marca[];
  modelos: Modelo[];
  colores: Color[];
  tipos: TipoEquipo[];
  estados: EstadoOperativo[];
  ubicaciones: Ubicacion[];
}) {
  const { inventario: initial, categorias, marcas, modelos, colores, tipos, estados, ubicaciones } = props;
  const [inventario, setInventario] = useState(initial);
  const [catFilter, setCatFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [sedeFilter, setSedeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [labelModal, setLabelModal] = useState<InventarioView | null>(null);
  const [wsModal, setWsModal] = useState<InventarioView | null>(null);
  const [actaModal, setActaModal] = useState<InventarioView | null>(null);
  const [hwModal, setHwModal] = useState(false);
  const [hwStatus, setHwStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewEquipo, setViewEquipo] = useState<InventarioView | null>(null);

  // form state
  const [form, setForm] = useState({
    codigo_patrimonial: "",
    codigo_barras: "",
    numero_serie: "",
    id_categoria: 0,
    id_tipo_equipo: 0,
    id_marca: 0,
    id_modelo: 0,
    id_color: 0,
    id_estado: 0,
    id_ubicacion_actual: 0,
    id_equipo_padre: "",
    centro_costo: "",
    nombre_equipo: "",
    tipo_conexion: "",
    direccion_mac: "",
    direccion_ip: "",
    anydesk: "",
    rustdesk: "",
    sistema_operativo: "",
    bits: "",
    procesador: "",
    cpu_ghz: "",
    ram_gb: "",
    tipo_ram: "",
    disco_duro: "",
    tipo_disco: "",
    estado_disco: "",
    fecha_adquisicion: "",
    garantia_hasta: "",
    valor_compra: "",
    fecha_donacion: "",
    fecha_alta: "",
    observaciones: "",
    specs: {} as Record<string, unknown>,
  });

  const filtered = useMemo(() => {
    return inventario.filter((e) => {
      if (catFilter && e.categoria !== catFilter) return false;
      if (estadoFilter && e.estado !== estadoFilter) return false;
      if (sedeFilter && e.area_departamento !== sedeFilter) return false;
      if (search && ![e.codigo_patrimonial, e.codigo_barras, e.numero_serie ?? ""].some((v) => v.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [inventario, catFilter, estadoFilter, sedeFilter, search]);

  const categoriaNombre = categorias.find((c) => c.id_categoria === form.id_categoria)?.nombre ?? "";
  const specFields = SPEC_FIELDS[categoriaNombre] ?? [];
  const modelosFiltrados = modelos.filter((m) => m.id_marca === form.id_marca && m.id_categoria === form.id_categoria);
  const tiposFiltrados = tipos.filter((t) => t.id_categoria === form.id_categoria);
  const pcs = inventario.filter((e) => e.categoria === "PC/Workstation");

  async function saveEquipo() {
    const admin = createClient();
    const { data, error } = await admin.from("equipos").insert({
      codigo_patrimonial: form.codigo_patrimonial,
      codigo_barras: form.codigo_barras,
      numero_serie: form.numero_serie || null,
      id_categoria: form.id_categoria,
      id_tipo_equipo: form.id_tipo_equipo || null,
      id_marca: form.id_marca,
      id_modelo: form.id_modelo || null,
      id_color: form.id_color || null,
      id_estado: form.id_estado,
      id_ubicacion_actual: form.id_ubicacion_actual,
      id_equipo_padre: form.id_equipo_padre || null,
      centro_costo: form.centro_costo || null,
      nombre_equipo: form.nombre_equipo || null,
      tipo_conexion: form.tipo_conexion || null,
      direccion_mac: form.direccion_mac || null,
      direccion_ip: form.direccion_ip || null,
      anydesk: form.anydesk || null,
      rustdesk: form.rustdesk || null,
      sistema_operativo: form.sistema_operativo || null,
      bits: form.bits ? Number(form.bits) : null,
      procesador: form.procesador || null,
      cpu_ghz: form.cpu_ghz ? Number(form.cpu_ghz) : null,
      ram_gb: form.ram_gb ? Number(form.ram_gb) : null,
      tipo_ram: form.tipo_ram || null,
      disco_duro: form.disco_duro || null,
      tipo_disco: form.tipo_disco || null,
      estado_disco: form.estado_disco || null,
      fecha_adquisicion: form.fecha_adquisicion || null,
      garantia_hasta: form.garantia_hasta || null,
      fecha_donacion: form.fecha_donacion || null,
      fecha_alta: form.fecha_alta || null,
      observaciones: form.observaciones || null,
      registrado_por: (await admin.from("usuarios").select("id_usuario").eq("username", "admin").single()).data?.id_usuario,
    }).select().single();
    if (data) {
      const { data: full } = await admin.from("vista_inventario_completo").select("*").eq("id_equipo", (data as { id_equipo: string }).id_equipo).single();
      if (full) setInventario((inv) => [full as InventarioView, ...inv]);
    }
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Inventario de Equipos</h1>
        <button onClick={() => setModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Nuevo Equipo
        </button>
        <button onClick={() => { setHwModal(true); setHwStatus(""); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Monitor size={16} /> Auto-Registrar Este Equipo
        </button>
        <button onClick={() => {
          const rows = selected.size > 0 ? filtered.filter((e) => selected.has(e.id_equipo)) : filtered;
          exportToExcel({
          title: "BERU - Inventario de Equipos",
          exportedBy: "admin",
          sheets: (() => {
            const cols = [
              { header: "Código Patrimonial", key: "codigo_patrimonial", width: 18 },
              { header: "Código Barras", key: "codigo_barras", width: 16 },
              { header: "N° Serie", key: "numero_serie", width: 16 },
              { header: "Tipo", key: "tipo_equipo", width: 16 },
              { header: "Categoría", key: "categoria", width: 16 },
              { header: "Sede", key: "sede", width: 14 },
              { header: "Centro de Costo", key: "centro_costo", width: 18 },
              { header: "Ubicación Física", key: "piso_oficina", width: 14 },
              { header: "Área", key: "area_departamento", width: 18 },
              { header: "Marca", key: "marca", width: 12 },
              { header: "Modelo", key: "modelo", width: 18 },
              { header: "Color", key: "color", width: 10 },
              { header: "Nombre del Equipo", key: "nombre_equipo", width: 20 },
              { header: "Sistema Operativo", key: "sistema_operativo", width: 16 },
              { header: "Bits", key: "bits", width: 6 },
              { header: "Procesador", key: "procesador", width: 25 },
              { header: "CPU (GHz)", key: "cpu_ghz", width: 10 },
              { header: "RAM (GB)", key: "ram_gb", width: 10 },
              { header: "Tipo RAM", key: "tipo_ram", width: 10 },
              { header: "Disco Duro", key: "disco_duro", width: 12 },
              { header: "Tipo Disco", key: "tipo_disco", width: 12 },
              { header: "Estado Disco", key: "estado_disco", width: 12 },
              { header: "Tipo Conexión", key: "tipo_conexion", width: 16 },
              { header: "Dirección IP", key: "direccion_ip", width: 16 },
              { header: "Dirección MAC", key: "direccion_mac", width: 18 },
              { header: "AnyDesk", key: "anydesk", width: 14 },
              { header: "RustDesk", key: "rustdesk", width: 14 },
              { header: "Estado", key: "estado", width: 14 },
              { header: "Usuario Asignado", key: "usuario_asignado", width: 18 },
              { header: "Equipo Padre", key: "equipo_padre_codigo_patrimonial", width: 16 },
              { header: "Fecha Adquisición", key: "fecha_adquisicion", width: 16 },
              { header: "Garantía Hasta", key: "garantia_hasta", width: 16 },
              { header: "Fecha Donación", key: "fecha_donacion", width: 16 },
              { header: "Fecha Alta", key: "fecha_alta", width: 16 },
              { header: "Fecha Repotenciación", key: "fecha_repotechnacion", width: 18 },
              { header: "Fecha de Baja", key: "fecha_baja", width: 14 },
              { header: "Dominio", key: "dominio", width: 14 },
              { header: "Condición Propiedad", key: "condicion_propiedad", width: 16 },
              { header: "Observaciones", key: "observaciones", width: 30 },
              { header: "Info. Técnico", key: "informacion_tecnico", width: 30 },
            ];
            const cats = [...new Set(rows.map((e: any) => e.categoria ?? "Otros"))];
            return cats.map((cat: string) => ({
              name: String(cat).slice(0, 31),
              title: "Inventario - " + cat,
              columns: cols,
              rows: rows.filter((e: any) => (e.categoria ?? "Otros") === cat) as unknown as Record<string, unknown>[],
              summary: [{ label: "Total registros", value: rows.filter((e: any) => (e.categoria ?? "Otros") === cat).length }],
            }));
          })(),
          filename: "BERU_Reporte_Inventario_" + new Date().toISOString().slice(0,10) + ".xlsx",
        });
        }} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Download size={16} /> Exportar Excel
        </button>
      </div>

      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => {
            if (e.key === "Enter") {
              const found = inventario.find((x) => x.codigo_barras === search || x.codigo_patrimonial === search || x.numero_serie === search);
              if (found) setLabelModal(found);
            }
          }} placeholder="Código patrimonial, barras o serie (escáner USB)..." className="flex-1 outline-none text-sm" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c.id_categoria} value={c.nombre}>{c.nombre}</option>)}
        </select>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          {estados.map((e) => <option key={e.id_estado} value={e.nombre}>{e.nombre}</option>)}
        </select>
        <select value={sedeFilter} onChange={(e) => setSedeFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">Todas las áreas</option>
          {ubicaciones.map((u) => <option key={u.id_ubicacion} value={u.area_departamento}>{u.area_departamento}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0">
            <tr>
              <th className="px-3 py-3 w-8">
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={(e) => {
                  if (e.target.checked) setSelected(new Set(filtered.map((x) => x.id_equipo)));
                  else setSelected(new Set());
                }} className="accent-indigo-600" />
              </th>
              <th className="text-left px-3 py-3">Código Pat.</th>
              <th className="text-left px-3 py-3">Cód. Barras</th>
              <th className="text-left px-3 py-3">Categoría</th>
              <th className="text-left px-3 py-3">Marca / Modelo</th>
              <th className="text-left px-3 py-3">Estado</th>
              <th className="text-left px-3 py-3">Área</th>
              <th className="text-left px-3 py-3">Usuario Asignado</th>
              <th className="text-left px-3 py-3">Padre</th>
              <th className="text-left px-3 py-3">Valor</th>
              <th className="text-right px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id_equipo} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(e.id_equipo)} onChange={(ev) => {
                    const n = new Set(selected);
                    if (ev.target.checked) n.add(e.id_equipo); else n.delete(e.id_equipo);
                    setSelected(n);
                  }} className="accent-indigo-600" />
                </td>
                <td className="px-3 py-2 font-mono text-xs">{e.codigo_patrimonial}</td>
                <td className="px-3 py-2 font-mono text-xs">{e.codigo_barras}</td>
                <td className="px-3 py-2">{e.categoria}</td>
                <td className="px-3 py-2">{e.marca} {e.modelo ?? ""}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                    e.estado === "Operativo" || e.estado === "Nuevo" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" :
                    e.estado === "En Mantenimiento" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" :
                    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {e.estado}
                  </span>
                </td>
                <td className="px-3 py-2">{e.area_departamento}</td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">{e.usuario_asignado ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{e.equipo_padre_codigo_patrimonial ?? "—"}</td>
                <td className="px-3 py-2">S/ {Number(e.valor_compra ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-0.5">
                    <button onClick={() => setViewEquipo(e)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Ver ficha"><Eye size={14} /></button>
                    {e.categoria === "PC/Workstation" && (
                      <>
                        <button onClick={() => setWsModal(e)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Ver estación de trabajo">
                          <Monitor size={14} />
                        </button>
                        <button onClick={() => setActaModal(e)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Emitir Acta de Cargo">
                          <FileText size={14} />
                        </button>
                      </>
                    )}
                    <button onClick={() => setLabelModal(e)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400" title="Generar etiqueta patrimonial">
                      <QrCode size={14} />
                    </button>
                    <button onClick={async () => {
                      const sb = createClient();
                      const deBaja = estados.find((x) => x.nombre === "De Baja");
                      if (deBaja) {
                        await sb.from("equipos").update({ id_estado: deBaja.id_estado }).eq("id_equipo", e.id_equipo);
                        setInventario((inv) => inv.map((x) => x.id_equipo === e.id_equipo ? { ...x, id_estado: deBaja.id_estado, estado: "De Baja" } : x));
                      }
                    }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-amber-600 dark:text-amber-400" title="Dar de baja">
                      <Ban size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl my-8 p-6 space-y-4">
            <h2 className="font-bold text-lg">Registrar Equipo</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="Código Patrimonial" value={form.codigo_patrimonial} onChange={(e) => setForm({ ...form, codigo_patrimonial: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Código de Barras" value={form.codigo_barras} onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Número de Serie" value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <select value={form.id_categoria} onChange={(e) => setForm({ ...form, id_categoria: Number(e.target.value), id_tipo_equipo: 0, id_modelo: 0, specs: {} })} className="border rounded-lg px-3 py-2 text-sm">
                <option value={0}>Categoría</option>
                {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
              </select>
              <select value={form.id_tipo_equipo} onChange={(e) => setForm({ ...form, id_tipo_equipo: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm">
                <option value={0}>Tipo de equipo</option>
                {tiposFiltrados.map((t) => <option key={t.id_tipo_equipo} value={t.id_tipo_equipo}>{t.nombre}</option>)}
              </select>
              <select value={form.id_marca} onChange={(e) => setForm({ ...form, id_marca: Number(e.target.value), id_modelo: 0 })} className="border rounded-lg px-3 py-2 text-sm">
                <option value={0}>Marca</option>
                {marcas.map((m) => <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>)}
              </select>
              <select value={form.id_modelo} onChange={(e) => setForm({ ...form, id_modelo: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm">
                <option value={0}>Modelo</option>
                {modelosFiltrados.map((m) => <option key={m.id_modelo} value={m.id_modelo}>{m.nombre}</option>)}
              </select>
              <select value={form.id_color} onChange={(e) => setForm({ ...form, id_color: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm">
                <option value={0}>Color</option>
                {colores.map((c) => <option key={c.id_color} value={c.id_color}>{c.nombre}</option>)}
              </select>
              <select value={form.id_estado} onChange={(e) => setForm({ ...form, id_estado: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm">
                <option value={0}>Estado</option>
                {estados.map((e) => <option key={e.id_estado} value={e.id_estado}>{e.nombre}</option>)}
              </select>
              <select value={form.id_ubicacion_actual} onChange={(e) => setForm({ ...form, id_ubicacion_actual: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm">
                <option value={0}>Ubicación</option>
                {ubicaciones.map((u) => <option key={u.id_ubicacion} value={u.id_ubicacion}>{u.area_departamento}</option>)}
              </select>
              <select value={form.id_equipo_padre} onChange={(e) => setForm({ ...form, id_equipo_padre: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Sin equipo padre (independiente)</option>
                {pcs.map((p) => <option key={p.id_equipo} value={p.id_equipo}>{p.codigo_patrimonial} - {p.marca}</option>)}
              </select>
              <input placeholder="Tipo conexión" value={form.tipo_conexion} onChange={(e) => setForm({ ...form, tipo_conexion: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Dirección MAC" value={form.direccion_mac} onChange={(e) => setForm({ ...form, direccion_mac: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Dirección IP" value={form.direccion_ip} onChange={(e) => setForm({ ...form, direccion_ip: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Centro de Costo" value={form.centro_costo} onChange={(e) => setForm({ ...form, centro_costo: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Nombre del Equipo" value={form.nombre_equipo} onChange={(e) => setForm({ ...form, nombre_equipo: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="AnyDesk" value={form.anydesk} onChange={(e) => setForm({ ...form, anydesk: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="RustDesk" value={form.rustdesk} onChange={(e) => setForm({ ...form, rustdesk: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Sistema Operativo" value={form.sistema_operativo} onChange={(e) => setForm({ ...form, sistema_operativo: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Bits (32/64)" value={form.bits} onChange={(e) => setForm({ ...form, bits: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Procesador" value={form.procesador} onChange={(e) => setForm({ ...form, procesador: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="CPU (GHz)" value={form.cpu_ghz} onChange={(e) => setForm({ ...form, cpu_ghz: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="RAM (GB)" value={form.ram_gb} onChange={(e) => setForm({ ...form, ram_gb: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Tipo RAM" value={form.tipo_ram} onChange={(e) => setForm({ ...form, tipo_ram: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Disco Duro" value={form.disco_duro} onChange={(e) => setForm({ ...form, disco_duro: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Tipo Disco" value={form.tipo_disco} onChange={(e) => setForm({ ...form, tipo_disco: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Estado Disco" value={form.estado_disco} onChange={(e) => setForm({ ...form, estado_disco: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Fecha Donación" type="date" value={form.fecha_donacion} onChange={(e) => setForm({ ...form, fecha_donacion: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Fecha Alta" type="date" value={form.fecha_alta} onChange={(e) => setForm({ ...form, fecha_alta: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Valor compra" type="number" value={form.valor_compra} onChange={(e) => setForm({ ...form, valor_compra: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={form.fecha_adquisicion} onChange={(e) => setForm({ ...form, fecha_adquisicion: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={form.garantia_hasta} onChange={(e) => setForm({ ...form, garantia_hasta: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            </div>

            {specFields.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Especificaciones técnicas</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {specFields.map((f) => (
                    <div key={f.key} className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 dark:text-slate-400 w-32">{f.label}</label>
                      {f.type === "checkbox" ? (
                        <input type="checkbox" checked={!!form.specs[f.key]} onChange={(e) => setForm({ ...form, specs: { ...form.specs, [f.key]: e.target.checked } })} className="accent-indigo-600" />
                      ) : (
                        <input
                          type={f.type ?? "text"}
                          value={(form.specs[f.key] as string) ?? ""}
                          onChange={(e) => setForm({ ...form, specs: { ...form.specs, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value } })}
                          className="border rounded-lg px-3 py-2 text-sm flex-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea placeholder="Observaciones" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />

            <div className="flex gap-2 justify-end">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              <button onClick={saveEquipo} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {labelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Etiqueta Patrimonial</h2>
              <button onClick={() => setLabelModal(null)} className="text-slate-400">✕</button>
            </div>
            <BarcodeLabel codigo={labelModal.codigo_patrimonial} codigoBarras={labelModal.codigo_barras} categoria={labelModal.categoria ?? ""} />
          </div>
        </div>
      )}

      {viewEquipo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-2">
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Ficha del Equipo</h2>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <div><span className="font-semibold">Código Patrimonial:</span> <span className="font-mono">{viewEquipo.codigo_patrimonial}</span></div>
              <div><span className="font-semibold">Código Barras:</span> <span className="font-mono">{viewEquipo.codigo_barras}</span></div>
              <div><span className="font-semibold">Serie:</span> <span className="font-mono">{viewEquipo.numero_serie ?? "—"}</span></div>
              <div><span className="font-semibold">Categoría:</span> {viewEquipo.categoria}</div>
              <div><span className="font-semibold">Marca/Modelo:</span> {viewEquipo.marca} {viewEquipo.modelo ?? ""}</div>
              <div><span className="font-semibold">Color:</span> {viewEquipo.color}</div>
              <div><span className="font-semibold">Estado:</span> {viewEquipo.estado}</div>
              <div><span className="font-semibold">Área:</span> {viewEquipo.area_departamento}</div>
              <div><span className="font-semibold">Padre:</span> {viewEquipo.equipo_padre_codigo_patrimonial ?? "—"}</div>
              <div><span className="font-semibold">Valor:</span> S/ {Number(viewEquipo.valor_compra ?? 0).toLocaleString()}</div>
              <div><span className="font-semibold">IP:</span> <span className="font-mono">{viewEquipo.direccion_ip ?? "—"}</span></div>
              <div><span className="font-semibold">MAC:</span> <span className="font-mono">{viewEquipo.direccion_mac ?? "—"}</span></div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setViewEquipo(null)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {wsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Estación de Trabajo</h2>
              <button onClick={() => setWsModal(null)} className="text-slate-400">✕</button>
            </div>
            <WorkstationTree parent={wsModal} hijos={inventario.filter((e) => e.id_equipo_padre === wsModal.id_equipo)} onUnlink={async (id) => {
              const admin = createClient();
              await admin.from("equipos").update({ id_equipo_padre: null }).eq("id_equipo", id);
              setInventario((inv) => inv.map((e) => e.id_equipo === id ? { ...e, id_equipo_padre: null, equipo_padre_codigo_patrimonial: null } : e));
            }} />
          </div>
        </div>
      )}

      {actaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl my-8 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">Acta de Cargo Patrimonial</h2>
              <button onClick={() => setActaModal(null)} className="text-slate-400">✕</button>
            </div>
            <ActaCargo parent={actaModal} hijos={inventario.filter((e) => e.id_equipo_padre === actaModal.id_equipo)} usuario="admin@sistema.com" />
          </div>
        </div>
      )}

      {hwModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-3">
            <h2 className="font-bold text-lg">Auto-Registrar Este Equipo</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Escanea las especificaciones técnicas de este equipo automáticamente.</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>Requisito:</strong> Ejecuta el agente local BERU en esta PC antes de escanear:
              <code className="block mt-1 bg-amber-100 px-2 py-1 rounded">powershell -ExecutionPolicy Bypass -File public/beru-hardware-agent.ps1</code>
              <a href="/beru-hardware-agent.ps1" download className="text-indigo-600 underline mt-1 inline-block">Descargar agente</a>
            </div>
            {hwStatus && <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded">{hwStatus}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setHwModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              <button onClick={async () => {
                setHwStatus("Escaneando hardware del sistema...");
                try {
                  const res = await fetch("http://localhost:9191/scan-hardware");
                  const data = await res.json();
                  setHwStatus("Escaneado: " + (data.hostname ?? "") + " · " + (data.procesador?.modelo ?? "") + " · " + (data.ram?.total_gb ?? 0) + "GB RAM");
                  // Prefill form
                  setForm((f) => ({
                    ...f,
                    codigo_patrimonial: "CPU-" + Date.now().toString().slice(-4),
                    codigo_barras: "BC-" + Date.now().toString().slice(-6),
                    numero_serie: data.serie_bios ?? "",
                    id_categoria: categorias.find((c) => c.nombre === "PC/Workstation")?.id_categoria ?? 0,
                    tipo_conexion: "RJ45 / Wi-Fi",
                    direccion_mac: data.mac ?? "",
                    direccion_ip: data.ip_local ?? "",
                    specs: {
                      procesador: data.procesador?.modelo ?? "",
                      ram_gb: data.ram?.total_gb ?? 0,
                      almacenamiento: (data.discos ?? []).map((d: { size_gb: number }) => d.size_gb + "GB").join(", "),
                    },
                    observaciones: "Auto-registrado por BERU Hardware Agent. OS: " + (data.sistema_operativo ?? ""),
                  }));
                  setModalOpen(true);
                  setHwModal(false);
                } catch {
                  setHwStatus("No se pudo conectar al agente local. Verifica que esté corriendo en localhost:9191.");
                }
              }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Escanear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


