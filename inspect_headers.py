import openpyxl

wb = openpyxl.load_workbook(r"D:\Descargas\INFORMES_ACTUALIZADA_2025.xlsx", data_only=True)
for ws in wb.worksheets:
    print("SHEET", ws.title, "max", ws.max_row, ws.max_column)
    for r in range(1, min(7, ws.max_row + 1)):
        vals = [f"{c.column_letter}:{str(c.value)[:24]}" for c in ws[r] if c.value is not None]
        print("  r" + str(r), " | ".join(vals[:20]))
    nonempty = sum(1 for row in ws.iter_rows(min_row=2) if any(c.value not in (None, "") for c in row))
    print("  filas_con_datos:", nonempty)
