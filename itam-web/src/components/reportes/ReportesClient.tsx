"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { exportToExcel } from "@/lib/excel";

const CAT_COLS = [
  { header: "Código Patrimonial", key: "codigo_patrimonial", width: 18 },
  { header: "Código Barras", key: "codigo_barras", width: 16 },
  { header: "N° Serie", key: "numero_serie", width: 16 },
  { header: "Categoría", key: "categoria", width: 16 },
  { header: "Tipo", key: "tipo_equipo", width: 16 },
  { header: "Sede", key: "sede", width: 14 },
  { header: "Área", key: "area_departamento", width: 18 },
  { header: "Ubicación Física", key: "piso_oficina", width: 14 },
  { header: "Marca", key: "marca", width: 12 },
  { header: "Modelo", key: "modelo", width: 18 },
  { header: "Color", key: "color", width: 10 },
  { header: "Estado", key: "estado", width: 14 },
  { header: "Usuario Asignado", key: "usuario_asignado", width: 18 },
  { header: "Equipo Padre", key: "equipo_padre_codigo_patrimonial", width: 16 },
  { header: "Tipo Conexión", key: "tipo_conexion", width: 16 },
  { header: "Dirección IP", key: "direccion_ip", width: 16 },
  { header: "Dirección MAC", key: "direccion_mac", width: 18 },
  { header: "Fecha Adquisición", key: "fecha_adquisicion", width: 16 },
  { header: "Garantía Hasta", key: "garantia_hasta", width: 16 },
  { header: "Observaciones", key: "observaciones", width: 30 },
];

const MANT_COLS = [
  { header: "C.P.", key: "equipo", width: 16 },
  { header: "Sede", key: "sede", width: 16 },
  { header: "Denominación", key: "denominacion", width: 22 },
  { header: "Tipo Mantenimiento", key: "tipo_mantenimiento", width: 18 },
  { header: "Descripción Falla", key: "descripcion_falla", width: 40 },
  { header: "Trabajo Realizado", key: "trabajo_realizado", width: 40 },
  { header: "Técnico / Responsable", key: "tecnico", width: 18 },
  { header: "Estado Servicio", key: "estado_servicio", width: 16 },
  { header: "Fecha Inicio", key: "fecha_registro", width: 18 },
  { header: "Fecha Fin", key: "fecha_finalizacion", width: 18 },
];

const HIST_COLS = [
  { header: "Equipo", key: "equipo", width: 16 },
  { header: "Tipo Acción", key: "tipo_accion", width: 20 },
  { header: "Ubicación Origen", key: "ubicacion_origen", width: 18 },
  { header: "Ubicación Destino", key: "ubicacion_destino", width: 18 },
  { header: "Usuario Anterior", key: "usuario_anterior", width: 16 },
  { header: "Usuario Nuevo", key: "usuario_nuevo", width: 16 },
  { header: "Estado Anterior", key: "estado_anterior", width: 14 },
  { header: "Estado Nuevo", key: "estado_nuevo", width: 14 },
  { header: "Autoriza", key: "autoriza", width: 16 },
  { header: "Motivo", key: "motivo", width: 40 },
  { header: "Fecha", key: "fecha_registro", width: 18 },
];

export function ReportesClient({ inventario, mantenimientos, historial, equipos, usuarios }: any) {
  const [msg, setMsg] = useState("");

  function userLabel(id: string | null) {
    if (!id) return "—";
    const u = usuarios.find((x: any) => x.id_usuario === id);
    return u ? u.username : id;
  }

  function equipoLabel(id: string | null) {
    if (!id) return "—";
    const e = equipos.find((x: any) => x.id_equipo === id);
    return e ? e.codigo_patrimonial : id;
  }

  // Reporte 1: Inventario de Equipos (por categoria, multi-hoja)
  function exportInventario() {
    const cats: string[] = [...new Set(inventario.map((e: any) => e.categoria ?? "Otros"))] as string[];
    const sheets = cats.map((cat: string) => ({
      name: String(cat).slice(0, 31),
      title: "Inventario - " + cat,
      columns: CAT_COLS,
      rows: inventario.filter((e: any) => (e.categoria ?? "Otros") === cat).map((e: any) => ({ ...e })),
      summary: [{ label: "Total registros", value: inventario.filter((e: any) => (e.categoria ?? "Otros") === cat).length }],
    }));
    // Add a consolidated sheet
    sheets.unshift({
      name: "Consolidado",
      title: "Inventario Consolidado - Todos los Equipos",
      columns: CAT_COLS,
      rows: inventario.map((e: any) => ({ ...e })),
      summary: [{ label: "Total registros", value: inventario.length }],
    });
    exportToExcel({
      title: "BERU - Reporte de Inventario de Equipos",
      exportedBy: "admin",
      sheets,
      filename: "BERU_Reporte_Inventario_" + new Date().toISOString().slice(0, 10) + ".xlsx",
    });
    setMsg("Reporte de Inventario generado.");
  }

  // Reporte 2: Mantenimientos
  function exportMantenimientos() {
    const rows = mantenimientos.map((m: any) => ({
      ...m,
      equipo: m.codigo_patrimonial ?? equipoLabel(m.id_equipo),
      tecnico: m.responsable_bien ?? userLabel(m.id_tecnico_responsable),
    }));
    exportToExcel({
      title: "BERU - Reporte de Mantenimientos",
      exportedBy: "admin",
      sheets: [{
        name: "Mantenimientos",
        title: "Historial de Mantenimientos",
        columns: MANT_COLS,
        rows,
        summary: [{ label: "Total mantenimientos", value: rows.length }],
      }],
      filename: "BERU_Reporte_Mantenimientos_" + new Date().toISOString().slice(0, 10) + ".xlsx",
    });
    setMsg("Reporte de Mantenimientos generado.");
  }

  // Reporte 3: Historial de Movimientos
  function exportMovimientos() {
    const rows = historial.map((h: any) => ({
      ...h,
      equipo: equipoLabel(h.id_equipo),
      autoriza: userLabel(h.id_usuario_autoriza),
      usuario_anterior: userLabel(h.id_usuario_anterior),
      usuario_nuevo: userLabel(h.id_usuario_nuevo),
    }));
    exportToExcel({
      title: "BERU - Reporte de Movimientos",
      exportedBy: "admin",
      sheets: [{
        name: "Movimientos",
        title: "Historial de Movimientos y Asignaciones",
        columns: HIST_COLS,
        rows,
        summary: [{ label: "Total movimientos", value: rows.length }],
      }],
      filename: "BERU_Reporte_Movimientos_" + new Date().toISOString().slice(0, 10) + ".xlsx",
    });
    setMsg("Reporte de Movimientos generado.");
  }

  // Reporte 4: Inventario IP (equipos con IP/MAC)
  function exportInventarioIP() {
    const ipEquipos = inventario.filter((e: any) => e.direccion_ip || e.direccion_mac);
    exportToExcel({
      title: "BERU - Inventario IP y Red",
      exportedBy: "admin",
      sheets: [{
        name: "Inventario IP",
        title: "Equipos con Dirección IP y MAC",
        columns: [
          { header: "Código Patrimonial", key: "codigo_patrimonial", width: 18 },
          { header: "Categoría", key: "categoria", width: 16 },
          { header: "Marca", key: "marca", width: 12 },
          { header: "Modelo", key: "modelo", width: 18 },
          { header: "Estado", key: "estado", width: 14 },
          { header: "Área", key: "area_departamento", width: 18 },
          { header: "Dirección IP", key: "direccion_ip", width: 16 },
          { header: "Dirección MAC", key: "direccion_mac", width: 18 },
          { header: "Tipo Conexión", key: "tipo_conexion", width: 16 },
          { header: "Usuario Asignado", key: "usuario_asignado", width: 18 },
        ],
        rows: ipEquipos as unknown as Record<string, unknown>[],
        summary: [{ label: "Total con IP/MAC", value: ipEquipos.length }],
      }],
      filename: "BERU_Reporte_Inventario_IP_" + new Date().toISOString().slice(0, 10) + ".xlsx",
    });
    setMsg("Reporte de Inventario IP generado.");
  }

  const btnCls = "bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition shadow-sm";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reportes Profesionales BERU</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Genera reportes en formato Excel profesional (.xlsx) con múltiples hojas, membrete institucional y formato corporativo.</p>

      {msg && <div className="text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 p-3 rounded-xl">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={24} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Inventario de Equipos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Multi-hoja por categoría + consolidado. Sin precios.</p>
            </div>
          </div>
          <button onClick={exportInventario} className={btnCls}>
            <Download size={16} /> Generar Reporte
          </button>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={24} className="text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Mantenimientos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Historial completo con C.P., diagnóstico, técnico y estado.</p>
            </div>
          </div>
          <button onClick={exportMantenimientos} className={btnCls}>
            <Download size={16} /> Generar Reporte
          </button>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={24} className="text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Movimientos</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Historial de traslados y asignaciones.</p>
            </div>
          </div>
          <button onClick={exportMovimientos} className={btnCls}>
            <Download size={16} /> Generar Reporte
          </button>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={24} className="text-cyan-600 dark:text-cyan-400" />
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Inventario IP y Red</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Equipos con IP, MAC y datos de red.</p>
            </div>
          </div>
          <button onClick={exportInventarioIP} className={btnCls}>
            <Download size={16} /> Generar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}