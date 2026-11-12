"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Categoria, Marca, Color, Ubicacion, TipoEquipo, Modelo } from "@/lib/types";

type Tab = "categorias" | "marcas" | "colores" | "ubicaciones";

export function CatalogosClient(props: {
  categorias: Categoria[]; marcas: Marca[]; colores: Color[]; ubicaciones: Ubicacion[]; tipos: TipoEquipo[]; modelos: Modelo[];
}) {
  const [tab, setTab] = useState<Tab>("categorias");
  const [categorias, setCategorias] = useState(props.categorias);
  const [marcas, setMarcas] = useState(props.marcas);
  const [colores, setColores] = useState(props.colores);
  const [ubicaciones, setUbicaciones] = useState(props.ubicaciones);

  const [newCat, setNewCat] = useState({ nombre: "", prefijo: "" });
  const [newMarca, setNewMarca] = useState("");
  const [newColor, setNewColor] = useState({ nombre: "", hex: "#000000" });
  const [newUbi, setNewUbi] = useState({ sede: "", area: "", piso: "" });

  async function addCategoria() {
    if (!newCat.nombre) return;
    const admin = createClient();
    const { data } = await admin.from("categorias").insert({ nombre: newCat.nombre, prefijo_codigo: newCat.prefijo.toUpperCase(), esquema_atributos_sugerido: {}, vida_util_anios: 4, activo: true }).select().single();
    if (data) setCategorias((c) => [...c, data as Categoria]);
    setNewCat({ nombre: "", prefijo: "" });
  }
  async function addMarca() {
    if (!newMarca) return;
    const admin = createClient();
    const { data } = await admin.from("marcas").insert({ nombre: newMarca, activo: true }).select().single();
    if (data) setMarcas((m) => [...m, data as Marca]);
    setNewMarca("");
  }
  async function addColor() {
    if (!newColor.nombre) return;
    const admin = createClient();
    const { data } = await admin.from("colores").insert({ nombre: newColor.nombre, codigo_hex: newColor.hex }).select().single();
    if (data) setColores((c) => [...c, data as Color]);
    setNewColor({ nombre: "", hex: "#000000" });
  }
  async function addUbi() {
    if (!newUbi.sede || !newUbi.area) return;
    const admin = createClient();
    const { data } = await admin.from("ubicaciones").insert({ sede: newUbi.sede, area_departamento: newUbi.area, piso_oficina: newUbi.piso, activo: true }).select().single();
    if (data) setUbicaciones((u) => [...u, data as Ubicacion]);
    setNewUbi({ sede: "", area: "", piso: "" });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "categorias", label: "Categorías" },
    { key: "marcas", label: "Marcas" },
    { key: "colores", label: "Colores" },
    { key: "ubicaciones", label: "Ubicaciones" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Catálogos Maestros</h1>
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "categorias" && (
        <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
          <div className="flex gap-2">
            <input placeholder="Nombre categoría" value={newCat.nombre} onChange={(e) => setNewCat({ ...newCat, nombre: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1" />
            <input placeholder="Prefijo (MON)" value={newCat.prefijo} onChange={(e) => setNewCat({ ...newCat, prefijo: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-28" />
            <button onClick={addCategoria} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Agregar</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="text-left px-3 py-2">Nombre</th><th className="text-left px-3 py-2">Prefijo</th><th className="text-left px-3 py-2">Vida útil</th><th className="text-left px-3 py-2">Estado</th></tr></thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.id_categoria} className="border-t"><td className="px-3 py-2">{c.nombre}</td><td className="px-3 py-2 font-mono">{c.prefijo_codigo}</td><td className="px-3 py-2">{c.vida_util_anios} años</td><td className="px-3 py-2">{c.activo ? "ACTIVO" : "ANULADO"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "marcas" && (
        <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
          <div className="flex gap-2">
            <input placeholder="Nombre marca" value={newMarca} onChange={(e) => setNewMarca(e.target.value)} className="border rounded-lg px-3 py-2 text-sm flex-1" />
            <button onClick={addMarca} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Agregar</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {marcas.map((m) => (
              <span key={m.id_marca} className="bg-slate-100 px-3 py-1.5 rounded-lg text-sm">{m.nombre}</span>
            ))}
          </div>
        </div>
      )}

      {tab === "colores" && (
        <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
          <div className="flex gap-2">
            <input placeholder="Nombre color" value={newColor.nombre} onChange={(e) => setNewColor({ ...newColor, nombre: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1" />
            <input type="color" value={newColor.hex} onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })} className="border rounded-lg w-12 h-10" />
            <button onClick={addColor} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Agregar</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {colores.map((c) => (
              <div key={c.id_color} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                <span className="w-5 h-5 rounded border" style={{ background: c.codigo_hex }} />
                <span className="text-sm">{c.nombre}</span>
                <span className="text-xs text-slate-400 font-mono">{c.codigo_hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "ubicaciones" && (
        <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
          <div className="flex gap-2">
            <input placeholder="Sede" value={newUbi.sede} onChange={(e) => setNewUbi({ ...newUbi, sede: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1" />
            <input placeholder="Área/Departamento" value={newUbi.area} onChange={(e) => setNewUbi({ ...newUbi, area: e.target.value })} className="border rounded-lg px-3 py-2 text-sm flex-1" />
            <input placeholder="Piso" value={newUbi.piso} onChange={(e) => setNewUbi({ ...newUbi, piso: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-24" />
            <button onClick={addUbi} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Agregar</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="text-left px-3 py-2">Sede</th><th className="text-left px-3 py-2">Área</th><th className="text-left px-3 py-2">Piso</th><th className="text-left px-3 py-2">Estado</th></tr></thead>
            <tbody>
              {ubicaciones.map((u) => (
                <tr key={u.id_ubicacion} className="border-t"><td className="px-3 py-2">{u.sede}</td><td className="px-3 py-2">{u.area_departamento}</td><td className="px-3 py-2">{u.piso_oficina}</td><td className="px-3 py-2">{u.activo ? "ACTIVO" : "ANULADO"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
