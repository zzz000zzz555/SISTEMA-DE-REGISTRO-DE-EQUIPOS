"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Download } from "lucide-react";
import { exportToExcel } from "@/lib/excel";
import { createAdminClient } from "@/lib/supabase/admin";
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
    tipo_conexion: "",
    direccion_mac: "",
    direccion_ip: "",
    valor_compra: "",
    fecha_adquisicion: "",
    garantia_hasta: "",
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
    const admin = createAdminClient();
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
      tipo_conexion: form.tipo_conexion || null,
      direccion_mac: form.direccion_mac || null,
      direccion_ip: form.direccion_ip || null,
      especificaciones_tecnicas: form.specs,
      valor_compra: form.valor_compra ? Number(form.valor_compra) : null,
      fecha_adquisicion: form.fecha_adquisicion || null,
      garantia_hasta: form.garantia_hasta || null,
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
        <h1 className="text-2xl font-bold text-slate-800">Inventario de Equipos</h1>
        <button onClick={() => setModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus size={16} /> Nuevo Equipo
        </button>
        <button onClick={() => exportToExcel({
          title: "Inventario de Equipos",
          exportedBy: "admin",
          columns: [
            { header: "Código Patrimonial", key: "codigo_patrimonial", width: 16 },
            { header: "Código Barras", key: "codigo_barras", width: 16 },
            { header: "N° Serie", key: "numero_serie", width: 14 },
            { header: "Categoría", key: "categoria", width: 16 },
            { header: "Marca", key: "marca", width: 12 },
            { header: "Modelo", key: "modelo", width: 16 },
            { header: "Estado", key: "estado", width: 14 },
            { header: "Área", key: "area_departamento", width: 16 },
            { header: "Padre", key: "equipo_padre_codigo_patrimonial", width: 14 },
            { header: "Valor Compra", key: "valor_compra", width: 12, currency: true },
            { header: "IP", key: "direccion_ip", width: 14 },
          ],
          rows: filtered as unknown as Record<string, unknown>[],
          summary: [
            { label: "Total registros", value: filtered.length },
            { label: "Valor patrimonial total", value: `S/ ${filtered.reduce((s, e) => s + Number(e.valor_compra ?? 0), 0).toLocaleString()}` },
          ],
          filename: "inventario_equipos.xlsx",
        })} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Download size={16} /> Exportar Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Código patrimonial, barras o serie..." className="flex-1 outline-none text-sm" />
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

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-3 py-3">Código Pat.</th>
              <th className="text-left px-3 py-3">Cód. Barras</th>
              <th className="text-left px-3 py-3">Categoría</th>
              <th className="text-left px-3 py-3">Marca / Modelo</th>
              <th className="text-left px-3 py-3">Estado</th>
              <th className="text-left px-3 py-3">Área</th>
              <th className="text-left px-3 py-3">Padre</th>
              <th className="text-left px-3 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id_equipo} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-xs">{e.codigo_patrimonial}</td>
                <td className="px-3 py-2 font-mono text-xs">{e.codigo_barras}</td>
                <td className="px-3 py-2">{e.categoria}</td>
                <td className="px-3 py-2">{e.marca} {e.modelo ?? ""}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    e.estado === "Operativo" || e.estado === "Nuevo" ? "bg-emerald-100 text-emerald-700" :
                    e.estado === "En Mantenimiento" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>{e.estado}</span>
                </td>
                <td className="px-3 py-2">{e.area_departamento}</td>
                <td className="px-3 py-2 text-xs">{e.equipo_padre_codigo_patrimonial ?? "—"}</td>
                <td className="px-3 py-2">S/ {Number(e.valor_compra ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 p-6 space-y-4">
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
              <input placeholder="Valor compra" type="number" value={form.valor_compra} onChange={(e) => setForm({ ...form, valor_compra: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={form.fecha_adquisicion} onChange={(e) => setForm({ ...form, fecha_adquisicion: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input type="date" value={form.garantia_hasta} onChange={(e) => setForm({ ...form, garantia_hasta: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            </div>

            {specFields.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-sm font-semibold text-slate-700 mb-2">Especificaciones técnicas</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {specFields.map((f) => (
                    <div key={f.key} className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 w-32">{f.label}</label>
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
    </div>
  );
}