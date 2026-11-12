import ExcelJS from "exceljs";

export type ExcelColumn = { header: string; key: string; width?: number; currency?: boolean };

export async function exportToExcel(opts: {
  title: string;
  subtitle?: string;
  exportedBy: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
  summary?: { label: string; value: string | number }[];
  filename: string;
}) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reporte");

  // Encabezado institucional
  ws.mergeCells("A1", `${String.fromCharCode(64 + opts.columns.length)}1`);
  const titleCell = ws.getCell("A1");
  titleCell.value = "BERU — SISTEMA EMPRESARIAL DE GESTIÓN PATRIMONIAL Y ACTIVOS TI";
  titleCell.font = { size: 14, bold: true, color: { argb: "FFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 22;

  ws.mergeCells("A2", `${String.fromCharCode(64 + opts.columns.length)}2`);
  const t2 = ws.getCell("A2");
  t2.value = opts.title;
  t2.font = { size: 12, bold: true };
  t2.alignment = { horizontal: "center" };

  ws.mergeCells("A3", `${String.fromCharCode(64 + opts.columns.length)}3`);
  ws.getCell("A3").value = `Generado: ${new Date().toLocaleString()} | Usuario: ${opts.exportedBy}`;
  ws.getCell("A3").font = { size: 9, italic: true, color: { argb: "64748B" } };
  ws.getCell("A3").alignment = { horizontal: "center" };

  if (opts.subtitle) {
    ws.mergeCells("A4", `${String.fromCharCode(64 + opts.columns.length)}4`);
    ws.getCell("A4").value = opts.subtitle;
    ws.getCell("A4").font = { size: 9, color: { argb: "64748B" } };
    ws.getCell("A4").alignment = { horizontal: "center" };
  }

  // Resumen ejecutivo
  let rowIdx = 6;
  if (opts.summary) {
    ws.getCell(`A${rowIdx}`).value = "Resumen Ejecutivo";
    ws.getCell(`A${rowIdx}`).font = { bold: true };
    rowIdx++;
    for (const s of opts.summary) {
      ws.getCell(`A${rowIdx}`).value = s.label;
      ws.getCell(`B${rowIdx}`).value = s.value;
      ws.getCell(`B${rowIdx}`).font = { bold: true };
      rowIdx++;
    }
    rowIdx++;
  }

  // Cabeceras
  const headerRow = rowIdx;
  opts.columns.forEach((col, i) => {
    const cell = ws.getCell(rowIdx, i + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
  ws.getRow(rowIdx).height = 20;
  rowIdx++;

  // Filas
  opts.rows.forEach((r, ri) => {
    opts.columns.forEach((col, ci) => {
      const cell = ws.getCell(rowIdx, ci + 1);
      const v = r[col.key];
      cell.value = (v === null || v === undefined) ? "" : (v as ExcelJS.CellValue);
      if (col.currency && typeof v === "number") {
        cell.numFmt = '"S/" #,##0.00';
      }
      cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
      if (ri % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
      }
      // color condicional estado
      const est = String(r["estado"] ?? r["estado_cuenta"] ?? "").toUpperCase();
      if (est.includes("ACTIVO") || est.includes("OPERATIVO") || est.includes("NUEVO")) {
        if (col.key.toLowerCase().includes("estado")) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DCFCE7" } };
      } else if (est.includes("MANTENIMIENTO")) {
        if (col.key.toLowerCase().includes("estado")) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF3C7" } };
      } else if (est.includes("BAJA") || est.includes("ANULADO") || est.includes("CESADO")) {
        if (col.key.toLowerCase().includes("estado")) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };
      }
    });
    rowIdx++;
  });

  // anchos
  opts.columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width ?? 18;
  });

  // autofilter + freeze
  ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: opts.columns.length } };
  ws.views = [{ state: "frozen", ySplit: headerRow }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.filename;
  a.click();
  URL.revokeObjectURL(url);
}