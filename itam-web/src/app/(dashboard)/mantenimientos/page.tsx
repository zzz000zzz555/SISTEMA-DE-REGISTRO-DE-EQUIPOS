import { createAdminClient } from "@/lib/supabase/admin";
import { MantenimientosClient } from "@/components/mantenimientos/MantenimientosClient";

export const dynamic = "force-dynamic";

export default async function MantenimientosPage() {
  const admin = createAdminClient();
  const [{ data: mant }, { data: equipos }] = await Promise.all([
    admin.from("mantenimientos").select("*").order("fecha_registro", { ascending: false }),
    admin.from("equipos").select("id_equipo, codigo_patrimonial").order("codigo_patrimonial"),
  ]);
  return <MantenimientosClient mantenimientos={mant ?? []} equipos={equipos ?? []} />;
}