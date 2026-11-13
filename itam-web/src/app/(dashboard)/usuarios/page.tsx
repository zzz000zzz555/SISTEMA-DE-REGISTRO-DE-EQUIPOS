"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UsuariosClient } from "@/components/usuarios/UsuariosClient";

export default function UsuariosPage() {
  const [props, setProps] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("usuarios").select("*").order("id_usuario"),
      sb.from("roles").select("*").order("id_rol"),
      sb.from("sesiones_tokens").select("*").order("fecha_registro", { ascending: false }),
    ]).then(([u, r, s]) => setProps({ usuarios: u.data ?? [], roles: r.data ?? [], sesiones: s.data ?? [] }));
  }, []);
  if (!props) return <div className="text-slate-400">Cargando...</div>;
  return <UsuariosClient {...props} />;
}
