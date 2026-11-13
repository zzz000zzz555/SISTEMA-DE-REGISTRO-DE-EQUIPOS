"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuditoriaClient } from "@/components/auditoria/AuditoriaClient";

export default function AuditoriaPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    const sb = createClient();
    sb.from("auditoria_sistema").select("*").order("fecha_registro", { ascending: false }).limit(200)
      .then(({ data }) => setRows(data ?? []));
  }, []);
  if (!rows) return <div className="text-slate-400">Cargando...</div>;
  return <AuditoriaClient rows={rows} />;
}
