"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ModulosClient } from "@/components/modulos/ModulosClient";

export default function ModulosPage() {
  const [props, setProps] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("modulos_sistema").select("*").order("orden_visual"),
      sb.from("permisos").select("*").order("id_permiso"),
    ]).then(([m, p]) => setProps({ modulos: m.data ?? [], permisos: p.data ?? [] }));
  }, []);
  if (!props) return <div className="text-slate-400">Cargando...</div>;
  return <ModulosClient {...props} />;
}
