"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReportesClient } from "@/components/reportes/ReportesClient";

export default function ReportesPage() {
  const [props, setProps] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("vista_inventario_completo").select("*").order("codigo_patrimonial"),
      sb.from("mantenimientos").select("*").order("fecha_registro", { ascending: false }),
      sb.from("historial_movimientos").select("*").order("fecha_registro", { ascending: false }),
      sb.from("equipos").select("id_equipo, codigo_patrimonial").order("codigo_patrimonial"),
      sb.from("usuarios").select("id_usuario, username, nombres, apellidos"),
    ]).then(([inv, mant, hist, eq, usr]) => setProps({
      inventario: inv.data ?? [],
      mantenimientos: mant.data ?? [],
      historial: hist.data ?? [],
      equipos: eq.data ?? [],
      usuarios: usr.data ?? [],
    }));
  }, []);
  if (!props) return <div className="text-slate-400">Cargando...</div>;
  return <ReportesClient {...props} />;
}