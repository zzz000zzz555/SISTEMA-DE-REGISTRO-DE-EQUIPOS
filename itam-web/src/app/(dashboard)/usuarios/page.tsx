import { createAdminClient } from "@/lib/supabase/admin";
import { UsuariosClient } from "@/components/usuarios/UsuariosClient";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const admin = createAdminClient();
  const [{ data: usuarios }, { data: roles }, { data: sesiones }] = await Promise.all([
    admin.from("usuarios").select("*").order("id_usuario"),
    admin.from("roles").select("*").order("id_rol"),
    admin.from("sesiones_tokens").select("*").order("fecha_registro", { ascending: false }),
  ]);
  return <UsuariosClient usuarios={usuarios ?? []} roles={roles ?? []} sesiones={sesiones ?? []} />;
}