"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ExcelJS from "exceljs";
import { Download, Eye, FileUp, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { exportToExcel } from "@/lib/excel";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { MODULOS, type ModuloConfig } from "@/lib/modulos-config";

const ALIASES: Record<string, string> = {
  CP: "codigo_patrimonial",
  CODPAT: "codigo_patrimonial",
  CODIGOPATRIMONIAL: "codigo_patrimonial",
  N: "numero_item",
  ITEM: "numero_item",
  NUMEROITEM: "numero_item",
  NSERIE: "numero_serie",
  SERIE: "serie",
  NUMEROSERIE: "numero_serie",
  EQUIPO: "nombre_equipo",
  IP: "ip_completa",
  MASCARA: "mascara_completa",
  GATEWAY: "puerta_enlace_completa",
};

function norm(s: unknown) {
  return String(s ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function label(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function badgeClass(value: string) {
  const v = value.toUpperCase();
  if (/OPERATIV|ACTIV|NUEVO|VERIFICAD|LIBRE|BUENO|FINALIZAD|HH/.test(v))
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (/MANTENIMIENTO|EN PROCESO|PENDIENTE|PERIFERIE/.test(v))
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  if (/BAJA|IRREPARABLE|MALO|INOPERATIV|ANULAD/.test(v))
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "SÍ" : "NO";
  if (typeof value === "object") return JSON.stringify(value);
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
}

export function ModuloTable({ modulo }: { modulo: keyof typeof MODULOS }) {
  const config: ModuloConfig = MODULOS[modulo];
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("TODOS");
  const [status, setStatus] = useState("TODOS");
  const [detail, setDetail] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const scopeField = config.columns.some((c) => c.key === "ambito") ? "ambito" : null;
  const statusField = config.columns.find((c) => c.badge && /estado|situacion|conservacion/i.test(c.key))?.key ?? null;

  async function reload() {
    const sb = createClient();
    const { data, error } = await sb.from(config.table).select("*").order(config.orderBy);
    if (error) setMessage(`Error al cargar: ${error.message}`);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    setSearch("");
    setScope("TODOS");
    setStatus("TODOS");
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulo]);

  const statusValues = useMemo(
    () => (statusField ? Array.from(new Set(items.map((i) => String(i[statusField] ?? "")).filter(Boolean))).sort() : []),
    [items, statusField]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return items.filter((row) => {
      if (scopeField && scope !== "TODOS" && String(row[scopeField] ?? "").toUpperCase() !== scope) return false;
      if (statusField && status !== "TODOS" && String(row[statusField] ?? "") !== status) return false;
      if (!q) return true;
      return Object.values(row).some((v) => String(v ?? "").toLocaleLowerCase().includes(q));
    });
  }, [items, search, scope, status, scopeField, statusField]);

  const { page, setPage, pageSize, setPageSize, totalPages, start, end, paged, total } = usePagination(filtered, 25);

  useEffect(() => {
    setPage(1);
  }, [search, scope, status, modulo, setPage]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(t);
  }, [message]);

  function doExport() {
    exportToExcel({
      title: config.title,
      exportedBy: "BERU Enterprise",
      filename: `${config.filename}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheets: [{
        name: "Registros",
        title: config.title,
        columns: config.columns.map((c) => ({ header: c.header, key: c.key, width: c.width })),
        rows: filtered,
      }],
    });
  }

  async function doImport(file: File) {
    setMessage("Importando archivo...");
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0];
      if (!ws) throw new Error("El archivo no contiene hojas");

      const wanted = new Map<string, string>();
      for (const c of config.columns) {
        wanted.set(norm(c.header), c.key);
        wanted.set(norm(c.key), c.key);
      }
      for (const [alias, key] of Object.entries(ALIASES)) {
        if (config.columns.some((c) => c.key === key)) wanted.set(alias, key);
      }

      let headerRow = 0;
      const mapping: Record<number, string> = {};
      for (let r = 1; r <= Math.min(ws.rowCount, 12); r++) {
        const found: Record<number, string> = {};
        ws.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
          const key = wanted.get(norm(cell.value));
          if (key) found[col] = key;
        });
        if (Object.keys(found).length >= 2) {
          headerRow = r;
          Object.assign(mapping, found);
          break;
        }
      }
      if (!headerRow) throw new Error("No se encontró una fila de cabeceras válida");

      const rows: Record<string, unknown>[] = [];
      for (let r = headerRow + 1; r <= ws.rowCount; r++) {
        const row: Record<string, unknown> = {};
        ws.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
          const key = mapping[col];
          if (!key) return;
          const v = cell.value;
          if (v === null || v === undefined || v === "") return;
          if (v instanceof Date) row[key] = v.toISOString().slice(0, 10);
          else if (typeof v === "object" && "result" in (v as object)) row[key] = String((v as any).result);
          else row[key] = typeof v === "string" ? v.trim() : v;
        });
        if (Object.values(row).some((v) => v !== undefined && v !== "")) rows.push(row);
      }
      if (!rows.length) throw new Error("No hay filas de datos para importar");

      const sb = createClient();
      let ok = 0;
      let lastError = "";
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await sb.from(config.table).insert(rows.slice(i, i + 100));
        if (error) lastError = error.message;
        else ok += Math.min(100, rows.length - i);
      }
      await reload();
      setMessage(lastError ? `Importados ${ok} de ${rows.length} registros. ${lastError}` : `Importados ${ok} registros correctamente.`);
    } catch (e: any) {
      setMessage(`No se pudo importar: ${e?.message ?? e}`);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  if (loading) return <div className="text-slate-400 py-8">Cargando {config.title.toLowerCase()}...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{config.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{config.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileUp size={16} /> Importar Excel
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xlsm"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
          />
          <button
            onClick={doExport}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Download size={16} /> Exportar Excel
          </button>
        </div>
      </div>

      {message && (
        <div className="glass-card flex items-center justify-between rounded-xl px-4 py-2.5 text-sm text-indigo-700 dark:text-indigo-300">
          <span>{message}</span>
          <button onClick={() => setMessage("")} aria-label="Cerrar mensaje"><X size={15} /></button>
        </div>
      )}

      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-700">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Búsqueda global en todos los campos..."
            className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
          />
        </div>
        {scopeField && (
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="TODOS">Todos los ámbitos</option>
            <option value="HH">HH</option>
            <option value="PERIFERIE">PERIFERIE</option>
          </select>
        )}
        {statusField && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="max-w-56 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="TODOS">Todos los estados</option>
            {statusValues.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        <div className="self-center text-xs text-slate-500 dark:text-slate-400">{total.toLocaleString("es-PE")} registros</div>
      </div>

      <div className="glass-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="w-14 px-3 py-2.5 text-left">#</th>
                {config.columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2.5 text-left">{c.header}</th>
                ))}
                <th className="px-3 py-2.5 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row, idx) => {
                const idKey = Object.keys(row).find((k) => /^id_/.test(k));
                return (
                  <tr key={idKey ? row[idKey] : start + idx} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2 text-xs text-slate-400" title={idKey ? `ID: ${row[idKey]}` : undefined}>{start + idx + 1}</td>
                    {config.columns.map((c) => {
                      const value = row[c.key];
                      return (
                        <td key={c.key} className="max-w-60 truncate px-3 py-2 text-slate-600 dark:text-slate-300">
                          {c.badge && value ? (
                            <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${badgeClass(String(value))}`}>
                              {display(value)}
                            </span>
                          ) : display(value)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setDetail(row)}
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Ver detalle"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr><td colSpan={config.columns.length + 2} className="py-8 text-center text-slate-400">Sin registros para los filtros seleccionados</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          start={start}
          end={end}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setDetail(null)}>
          <div className="glass-card max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Detalle del registro</h2>
              <button onClick={() => setDetail(null)} aria-label="Cerrar" className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
            </div>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {Object.entries(detail).filter(([k]) => !k.startsWith("id_") && !["created_at", "updated_at"].includes(k)).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-100 py-1.5 text-xs dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{label(k)}</span>
                  <span className="max-w-56 break-words text-right font-medium text-slate-700 dark:text-slate-200">{display(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
