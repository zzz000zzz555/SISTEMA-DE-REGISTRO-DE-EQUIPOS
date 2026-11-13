"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { SlidersHorizontal } from "lucide-react";

type Props = {
  total: number;
  equipos: any[];
  mantenimientos: any[];
};

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899"];

export function DashboardClient({ total, equipos, mantenimientos }: Props) {
  const [sede, setSede] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [marca, setMarca] = useState("");

  const sedes = useMemo(() => [...new Set(equipos.map((e) => e.area_departamento).filter(Boolean))], [equipos]);
  const categorias = useMemo(() => [...new Set(equipos.map((e) => e.categoria).filter(Boolean))], [equipos]);
  const estados = useMemo(() => [...new Set(equipos.map((e) => e.estado).filter(Boolean))], [equipos]);
  const marcas = useMemo(() => [...new Set(equipos.map((e) => e.marca).filter(Boolean))], [equipos]);

  const filtered = useMemo(() => equipos.filter((e) =>
    (!sede || e.area_departamento === sede) &&
    (!categoria || e.categoria === categoria) &&
    (!estado || e.estado === estado) &&
    (!marca || e.marca === marca)
  ), [equipos, sede, categoria, estado, marca]);

  const kpis = useMemo(() => {
    const porEstado: Record<string, number> = {};
    let valorTotal = 0;
    let perifericosVinculados = 0;
    let perifericosSueltos = 0;
    for (const e of filtered) {
      const est = e.estado ?? "Otros";
      porEstado[est] = (porEstado[est] ?? 0) + 1;
      valorTotal += Number(e.valor_compra ?? 0);
      if (e.id_equipo_padre) perifericosVinculados += 1;
      else if (e.categoria !== "PC/Workstation") perifericosSueltos += 1;
    }
    const costoMant = mantenimientos.reduce((s: number, m: { costo: number | null }) => s + Number(m.costo ?? 0), 0);
    const operativos = porEstado["Operativo"] ?? 0;
    const enMant = porEstado["En Mantenimiento"] ?? 0;
    const pctOper = filtered.length ? Math.round((operativos / filtered.length) * 100) : 0;
    return { totalEquipos: filtered.length, valorTotal, pctOperativos: pctOper, enMantenimiento: enMant, perifericosVinculados, perifericosSueltos, costoMantenimiento: costoMant };
  }, [filtered, mantenimientos]);

  const porCategoria = useMemo(() => {
    const r: Record<string, { count: number; valor: number }> = {};
    for (const e of filtered) {
      const cat = e.categoria ?? "Otros";
      if (!r[cat]) r[cat] = { count: 0, valor: 0 };
      r[cat].count += 1;
      r[cat].valor += Number(e.valor_compra ?? 0);
    }
    return r;
  }, [filtered]);

  const porEstado = useMemo(() => {
    const r: Record<string, number> = {};
    for (const e of filtered) {
      const est = e.estado ?? "Otros";
      r[est] = (r[est] ?? 0) + 1;
    }
    return r;
  }, [filtered]);

  const porSede = useMemo(() => {
    const r: Record<string, number> = {};
    for (const e of filtered) {
      const sede = e.area_departamento ?? "Otros";
      r[sede] = (r[sede] ?? 0) + 1;
    }
    return r;
  }, [filtered]);

  const catData = Object.entries(porCategoria).map(([name, v]) => ({ name, count: v.count, valor: v.valor }));
  const estadoData = Object.entries(porEstado).map(([name, value]) => ({ name, value }));
  const sedeData = Object.entries(porSede).map(([name, value]) => ({ name, value }));

  const selectCls = "border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard Ejecutivo BI — BERU</h1>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <SlidersHorizontal size={14} /> Filtros globales
        </div>
      </div>

      {/* Slicers */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-wrap gap-3">
        <select value={sede} onChange={(e) => setSede(e.target.value)} className={selectCls}>
          <option value="">Todas las áreas</option>
          {sedes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={selectCls}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className={selectCls}>
          <option value="">Todos los estados</option>
          {estados.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={marca} onChange={(e) => setMarca(e.target.value)} className={selectCls}>
          <option value="">Todas las marcas</option>
          {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        {(sede || categoria || estado || marca) && (
          <button onClick={() => { setSede(""); setCategoria(""); setEstado(""); setMarca(""); }} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Activos" value={kpis.totalEquipos} sub={`Valor: S/ ${kpis.valorTotal.toLocaleString()}`} color="indigo" />
        <KpiCard title="% Operativos" value={`${kpis.pctOperativos}%`} sub={`En mant.: ${kpis.enMantenimiento}`} color="green" />
        <KpiCard title="Periféricos Vinculados" value={kpis.perifericosVinculados} sub={`Sueltos: ${kpis.perifericosSueltos}`} color="amber" />
        <KpiCard title="Costo Mantenimiento" value={`S/ ${kpis.costoMantenimiento.toLocaleString()}`} sub="Acumulado" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Activos y Valor por Categoría</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={catData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Distribución por Estado</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={estadoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {estadoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Equipos por Área/Departamento</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sedeData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Valor Patrimonial por Categoría (S/)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="valor" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, color }: { title: string; value: string | number; sub: string; color: string }) {
  const map: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-rose-500 to-rose-600",
  };
  return (
    <div className={`bg-gradient-to-br ${map[color]} text-white rounded-xl p-4 shadow`}>
      <div className="text-xs opacity-80">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs opacity-80 mt-1">{sub}</div>
    </div>
  );
}