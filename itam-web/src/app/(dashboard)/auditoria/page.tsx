import { createAdminClient } from "@/lib/supabase/admin";
import { AuditoriaClient } from "@/components/auditoria/AuditoriaClient";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("auditoria_sistema").select("*").order("fecha_registro", { ascending: false }).limit(200);
  return <AuditoriaClient rows={data ?? []} />;
}