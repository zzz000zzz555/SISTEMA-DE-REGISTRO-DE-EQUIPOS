import ExcelJS from "exceljs";

export type ExcelColumn = { header: string; key: string; width?: number };

export type ExcelSheet = {
  name: string;
  title: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
  summary?: { label: string; value: string | number }[];
};

export async function exportToExcel(opts: {
  title: string;
  exportedBy: string;
  sheets: ExcelSheet[];
  filename: string;
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "BERU Enterprise";
  wb.created = new Date();

  for (const sh of opts.sheets) {
    const ws = wb.addWorksheet(sh.name);

    // Encabezado institucional (4 filas)
    const lastCol = String.fromCharCode(64 + Math.min(sh.columns.length, 26));
    ws.mergeCells(`A1:${lastCol}1`);
    const titleCell = ws.getCell("A1");
    titleCell.value = "BERU — SISTEMA EMPRESARIAL DE GESTIÓN PATRIMONIAL Y ACTIVOS TI";
    titleCell.font = { size: 14, bold: true, color: { argb: "FFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F172A" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 24;

    ws.mergeCells(`A2:${lastCol}2`);
    const t2 = ws.getCell("A2");
    t2.value = sh.title;
    t2.font = { size: 12, bold: true };
    t2.alignment = { horizontal: "center" };

    ws.mergeCells(`A3:${lastCol}3`);
    ws.getCell("A3").value = `Generado: ${new Date().toLocaleString()} | Usuario: ${opts.exportedBy}`;
    ws.getCell("A3").font = { size: 9, italic: true, color: { argb: "64748B" } };
    ws.getCell("A3").alignment = { horizontal: "center" };

    ws.mergeCells(`A4:${lastCol}4`);
    ws.getCell("A4").value = `Total de registros: ${sh.rows.length}`;
    ws.getCell("A4").font = { size: 9, color: { argb: "64748B" } };
    ws.getCell("A4").alignment = { horizontal: "center" };

    let rowIdx = 6;
    // Resumen ejecutivo
    if (sh.summary && sh.summary.length) {
      ws.getCell(`A${rowIdx}`).value = "Resumen Ejecutivo";
      ws.getCell(`A${rowIdx}`).font = { bold: true, size: 11 };
      rowIdx++;
      for (const s of sh.summary) {
        ws.getCell(`A${rowIdx}`).value = s.label;
        ws.getCell(`B${rowIdx}`).value = s.value;
        ws.getCell(`B${rowIdx}`).font = { bold: true };
        rowIdx++;
      }
      rowIdx++;
    }

    // Cabeceras
    const headerRow = rowIdx;
    sh.columns.forEach((col, i) => {
      const cell = ws.getCell(rowIdx, i + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: "FFFFFF" }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
      cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });
    ws.getRow(rowIdx).height = 22;
    rowIdx++;

    // Filas
    sh.rows.forEach((r, ri) => {
      sh.columns.forEach((col, ci) => {
        const cell = ws.getCell(rowIdx, ci + 1);
        const v = r[col.key];
        cell.value = (v === null || v === undefined) ? "" : (v as ExcelJS.CellValue);
        cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
        if (ri % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
        }
        const est = String(r["estado"] ?? r["estado_servicio"] ?? r["estado_cuenta"] ?? "").toUpperCase();
        if (est.includes("ACTIVO") || est.includes("OPERATIVO") || est.includes("NUEVO") || est.includes("FINALIZADO")) {
          if (col.key.toLowerCase().includes("estado")) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DCFCE7" } };
        } else if (est.includes("MANTENIMIENTO") || est.includes("EN_PROCESO")) {
          if (col.key.toLowerCase().includes("estado")) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF3C7" } };
        } else if (est.includes("BAJA") || est.includes("ANULADO") || est.includes("CESADO") || est.includes("IRREPARABLE")) {
          if (col.key.toLowerCase().includes("estado")) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };
        }
      });
      rowIdx++;
    });

    // anchos
    sh.columns.forEach((col, i) => {
      ws.getColumn(i + 1).width = col.width ?? 18;
    });

    // autofilter + freeze
    ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: sh.columns.length } };
    ws.views = [{ state: "frozen", ySplit: headerRow }];
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.filename;
  a.click();
  URL.revokeObjectURL(url);
}