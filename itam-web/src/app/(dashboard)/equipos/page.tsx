"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EquiposClient } from "@/components/equipos/EquiposClient";

export default function EquiposPage() {
  const [props, setProps] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("vista_inventario_completo").select("*").order("codigo_patrimonial"),
      sb.from("categorias").select("*").eq("activo", true).order("nombre"),
      sb.from("marcas").select("*").eq("activo", true).order("nombre"),
      sb.from("modelos").select("*").eq("activo", true).order("nombre"),
      sb.from("colores").select("*").order("nombre"),
      sb.from("tipos_equipo").select("*").eq("activo", true).order("nombre"),
      sb.from("estados_operativos").select("*").order("id_estado"),
      sb.from("ubicaciones").select("*").eq("activo", true).order("area_departamento"),
    ]).then(([inv, cat, mar, mod, col, tip, est, ubi]) => {
      setProps({
        inventario: inv.data ?? [],
        categorias: cat.data ?? [],
        marcas: mar.data ?? [],
        modelos: mod.data ?? [],
        colores: col.data ?? [],
        tipos: tip.data ?? [],
        estados: est.data ?? [],
        ubicaciones: ubi.data ?? [],
      });
    });
  }, []);
  if (!props) return <div className="text-slate-400">Cargando...</div>;
  return <EquiposClient {...props} />;
}