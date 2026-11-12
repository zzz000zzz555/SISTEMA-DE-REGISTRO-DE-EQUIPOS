import { createAdminClient } from "@/lib/supabase/admin";
import { CatalogosClient } from "@/components/catalogos/CatalogosClient";

export const dynamic = "force-dynamic";

export default async function CatalogosPage() {
  const admin = createAdminClient();
  const [{ data: categorias }, { data: marcas }, { data: colores }, { data: ubicaciones }, { data: tipos }, { data: modelos }] = await Promise.all([
    admin.from("categorias").select("*").order("id_categoria"),
    admin.from("marcas").select("*").order("id_marca"),
    admin.from("colores").select("*").order("id_color"),
    admin.from("ubicaciones").select("*").order("id_ubicacion"),
    admin.from("tipos_equipo").select("*").order("id_tipo_equipo"),
    admin.from("modelos").select("*").order("id_modelo"),
  ]);
  return (
    <CatalogosClient
      categorias={categorias ?? []}
      marcas={marcas ?? []}
      colores={colores ?? []}
      ubicaciones={ubicaciones ?? []}
      tipos={tipos ?? []}
      modelos={modelos ?? []}
    />
  );
}