"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("equipos").select("*", { count: "exact", head: true }),
      sb.from("vista_inventario_completo").select("*"),
      sb.from("mantenimientos").select("*"),
    ]).then(([total, equipos, mant]) => {
      setData({ total: total.count ?? 0, equipos: equipos.data ?? [], mantenimientos: mant.data ?? [] });
    });
  }, []);
  if (!data) return <div className="text-slate-400">Cargando...</div>;
  return <DashboardClient total={data.total} equipos={data.equipos} mantenimientos={data.mantenimientos} />;
}