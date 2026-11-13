"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function DashboardPage() {
  const [props, setProps] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("equipos").select("*", { count: "exact", head: true }),
      sb.from("vista_inventario_completo").select("*"),
      sb.from("mantenimientos").select("*"),
    ]).then(([total, equipos, mant]) => {
      const porCategoria: Record<string, { count: number; valor: number }> = {};
      const porEstado: Record<string, number> = {};
      const porSede: Record<string, number> = {};
      let valorTotal = 0;
      let perifericosVinculados = 0;
      let perifericosSueltos = 0;
      for (const e of equipos.data ?? []) {
        const cat = e.categoria ?? "Otros";
        if (!porCategoria[cat]) porCategoria[cat] = { count: 0, valor: 0 };
        porCategoria[cat].count += 1;
        porCategoria[cat].valor += Number(e.valor_compra ?? 0);
        valorTotal += Number(e.valor_compra ?? 0);
        const est = e.estado ?? "Otros";
        porEstado[est] = (porEstado[est] ?? 0) + 1;
        const sede = e.area_departamento ?? "Otros";
        porSede[sede] = (porSede[sede] ?? 0) + 1;
        if (e.id_equipo_padre) perifericosVinculados += 1;
        else if (cat !== "PC/Workstation") perifericosSueltos += 1;
      }
      const costoMant = (mant.data ?? []).reduce((s: number, m: { costo: number | null }) => s + Number(m.costo ?? 0), 0);
      const operativos = porEstado["Operativo"] ?? 0;
      const enMant = porEstado["En Mantenimiento"] ?? 0;
      const totalN = total.count ?? 0;
      const pctOper = totalN ? Math.round((operativos / totalN) * 100) : 0;
      setProps({
        kpis: {
          totalEquipos: totalN,
          valorTotal,
          pctOperativos: pctOper,
          enMantenimiento: enMant,
          perifericosVinculados,
          perifericosSueltos,
          costoMantenimiento: costoMant,
        },
        porCategoria,
        porEstado,
        porSede,
      });
    });
  }, []);
  if (!props) return <div className="text-slate-400">Cargando...</div>;
  return <DashboardClient {...props} />;
}
