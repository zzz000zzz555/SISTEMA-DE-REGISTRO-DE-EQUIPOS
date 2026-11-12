"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RolesClient } from "@/components/roles/RolesClient";

export default function RolesPage() {
  const [props, setProps] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("roles").select("*").order("id_rol"),
      sb.from("modulos_sistema").select("*").order("orden_visual"),
      sb.from("permisos").select("*").order("id_permiso"),
      sb.from("roles_permisos").select("*"),
    ]).then(([r, m, p, rp]) => {
      setProps({ roles: r.data ?? [], modulos: m.data ?? [], permisos: p.data ?? [], rolePermisos: rp.data ?? [] });
    });
  }, []);
  if (!props) return <div className="text-slate-400">Cargando...</div>;
  return <RolesClient {...props} />;
}