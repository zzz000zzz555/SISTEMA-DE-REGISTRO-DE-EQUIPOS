"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MantenimientosClient } from "@/components/mantenimientos/MantenimientosClient";

export default function MantenimientosPage() {
  const [props, setProps] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("mantenimientos").select("*").order("fecha_registro", { ascending: false }),
      sb.from("equipos").select("id_equipo, codigo_patrimonial").order("codigo_patrimonial"),
      sb.from("usuarios").select("id_usuario, username, nombres, apellidos").order("username"),
    ]).then(([m, e, u]) => setProps({ mantenimientos: m.data ?? [], equipos: e.data ?? [], usuarios: u.data ?? [] }));
  }, []);
  if (!props) return <div className="text-slate-400">Cargando...</div>;
  return <MantenimientosClient {...props} />;
}

