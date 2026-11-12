"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

type Props = {
  kpis: {
    totalEquipos: number;
    valorTotal: number;
    pctOperativos: number;
    enMantenimiento: number;
    perifericosVinculados: number;
    perifericosSueltos: number;
    costoMantenimiento: number;
  };
  porCategoria: Record<string, { count: number; valor: number }>;
  porEstado: Record<string, number>;
  porSede: Record<string, number>;
};

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899"];

export function DashboardClient({ kpis, porCategoria, porEstado, porSede }: Props) {
  const catData = Object.entries(porCategoria).map(([name, v]) => ({ name, count: v.count, valor: v.valor }));
  const estadoData = Object.entries(porEstado).map(([name, value]) => ({ name, value }));
  const sedeData = Object.entries(porSede).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard Ejecutivo BI</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Equipos" value={kpis.totalEquipos} sub={`Valor: S/ ${kpis.valorTotal.toLocaleString()}`} color="indigo" />
        <KpiCard title="% Operativos" value={`${kpis.pctOperativos}%`} sub={`En mant.: ${kpis.enMantenimiento}`} color="green" />
        <KpiCard title="Periféricos Vinculados" value={kpis.perifericosVinculados} sub={`Sueltos: ${kpis.perifericosSueltos}`} color="amber" />
        <KpiCard title="Costo Mantenimiento" value={`S/ ${kpis.costoMantenimiento.toLocaleString()}`} sub="Acumulado" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-slate-700 mb-3">Activos y Valor por Categoría</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={catData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-slate-700 mb-3">Distribución por Estado</h3>
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
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-slate-700 mb-3">Equipos por Área/Departamento</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sedeData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-semibold text-slate-700 mb-3">Valor Patrimonial por Categoría (S/)</h3>
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