import { createAdminClient } from "@/lib/supabase/admin";
import { ModulosClient } from "@/components/modulos/ModulosClient";

export const dynamic = "force-dynamic";

export default async function ModulosPage() {
  const admin = createAdminClient();
  const [{ data: modulos }, { data: permisos }] = await Promise.all([
    admin.from("modulos_sistema").select("*").order("orden_visual"),
    admin.from("permisos").select("*").order("id_permiso"),
  ]);
  return <ModulosClient modulos={modulos ?? []} permisos={permisos ?? []} />;
}