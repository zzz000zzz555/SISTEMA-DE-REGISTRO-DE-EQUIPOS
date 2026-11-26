"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IPInventarioClient } from "@/components/ip/IPInventarioClient";

export default function IPInventarioPage() {
  const [props, setProps] = useState<any>(null);
  useEffect(() => {
    const sb = createClient();
    sb.from("ip_inventario").select("*").order("octeto_3").order("octeto_4")
      .then(({ data }) => setProps({ items: data ?? [] }));
  }, []);
  if (!props) return <div className="text-slate-400">Cargando...</div>;
  return <IPInventarioClient {...props} />;
}