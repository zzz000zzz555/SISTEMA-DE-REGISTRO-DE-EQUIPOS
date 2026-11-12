import { createAdminClient } from "@/lib/supabase/admin";
import { RolesClient } from "@/components/roles/RolesClient";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const admin = createAdminClient();
  const [{ data: roles }, { data: modulos }, { data: permisos }, { data: rp }] = await Promise.all([
    admin.from("roles").select("*").order("id_rol"),
    admin.from("modulos_sistema").select("*").order("orden_visual"),
    admin.from("permisos").select("*").order("id_permiso"),
    admin.from("roles_permisos").select("*"),
  ]);
  return (
    <RolesClient
      roles={roles ?? []}
      modulos={modulos ?? []}
      permisos={permisos ?? []}
      rolePermisos={rp ?? []}
    />
  );
}