import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const admin = createAdminClient();

  const [{ count: totalEquipos }, { data: equipos }, { data: mantenimientos }] = await Promise.all([
    admin.from("equipos").select("*", { count: "exact", head: true }),
    admin.from("vista_inventario_completo").select("*"),
    admin.from("mantenimientos").select("*"),
  ]);

  const porCategoria: Record<string, { count: number; valor: number }> = {};
  const porEstado: Record<string, number> = {};
  const porSede: Record<string, number> = {};
  let valorTotal = 0;
  let perifericosVinculados = 0;
  let perifericosSueltos = 0;

  for (const e of equipos ?? []) {
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

  const costoMant = (mantenimientos ?? []).reduce((s: number, m: { costo: number | null }) => s + Number(m.costo ?? 0), 0);

  const operativos = porEstado["Operativo"] ?? 0;
  const enMant = porEstado["En Mantenimiento"] ?? 0;
  const pctOper = totalEquipos ? Math.round((operativos / (totalEquipos as number)) * 100) : 0;

  return (
    <DashboardClient
      kpis={{
        totalEquipos: totalEquipos ?? 0,
        valorTotal,
        pctOperativos: pctOper,
        enMantenimiento: enMant,
        perifericosVinculados,
        perifericosSueltos,
        costoMantenimiento: costoMant,
      }}
      porCategoria={porCategoria}
      porEstado={porEstado}
      porSede={porSede}
    />
  );
}