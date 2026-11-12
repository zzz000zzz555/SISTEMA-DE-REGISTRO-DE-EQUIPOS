import { createAdminClient } from "@/lib/supabase/admin";
import { EquiposClient } from "@/components/equipos/EquiposClient";

export const dynamic = "force-dynamic";

export default async function EquiposPage() {
  const admin = createAdminClient();
  const [
    { data: inventario },
    { data: categorias },
    { data: marcas },
    { data: modelos },
    { data: colores },
    { data: tipos },
    { data: estados },
    { data: ubicaciones },
  ] = await Promise.all([
    admin.from("vista_inventario_completo").select("*").order("codigo_patrimonial"),
    admin.from("categorias").select("*").eq("activo", true).order("nombre"),
    admin.from("marcas").select("*").eq("activo", true).order("nombre"),
    admin.from("modelos").select("*").eq("activo", true).order("nombre"),
    admin.from("colores").select("*").order("nombre"),
    admin.from("tipos_equipo").select("*").eq("activo", true).order("nombre"),
    admin.from("estados_operativos").select("*").order("id_estado"),
    admin.from("ubicaciones").select("*").eq("activo", true).order("area_departamento"),
  ]);
  return (
    <EquiposClient
      inventario={inventario ?? []}
      categorias={categorias ?? []}
      marcas={marcas ?? []}
      modelos={modelos ?? []}
      colores={colores ?? []}
      tipos={tipos ?? []}
      estados={estados ?? []}
      ubicaciones={ubicaciones ?? []}
    />
  );
}