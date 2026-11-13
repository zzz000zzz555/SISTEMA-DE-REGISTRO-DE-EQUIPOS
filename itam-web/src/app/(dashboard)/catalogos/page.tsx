"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CatalogosClient } from "@/components/catalogos/CatalogosClient";

export default function CatalogosPage() {
  const [props, setProps] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("categorias").select("*").order("id_categoria"),
      sb.from("marcas").select("*").order("id_marca"),
      sb.from("colores").select("*").order("id_color"),
      sb.from("ubicaciones").select("*").order("id_ubicacion"),
      sb.from("tipos_equipo").select("*").order("id_tipo_equipo"),
      sb.from("modelos").select("*").order("id_modelo"),
    ]).then(([c, m, col, u, t, mo]) => setProps({
      categorias: c.data ?? [], marcas: m.data ?? [], colores: col.data ?? [],
      ubicaciones: u.data ?? [], tipos: t.data ?? [], modelos: mo.data ?? [],
    }));
  }, []);
  if (!props) return <div className="text-slate-400">Cargando...</div>;
  return <CatalogosClient {...props} />;
}
