import openpyxl

wb = openpyxl.load_workbook(r"D:\Descargas\INFORMES_ACTUALIZADA_2025.xlsx", data_only=True)
for name, hdr in [("INFORMES_2026", 1), ("INFORMES_2025", 4), ("MTT0_2026", 1), ("MTTO_2025", 4), ("ALMACEN_COMPUTO", 1)]:
    ws = wb[name]
    hm = {}
    for c in ws[hdr]:
        if c.value:
            key = str(c.value).strip().upper().replace(" ", "").replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U")
            hm.setdefault(key, c.column)
    sc = hm.get("SEDE", hm.get("SEDEORIGEN", 3))
    dc = hm.get("DENOMINACION", hm.get("TIPO", 3))
    n = sum(
        1
        for r in range(hdr + 1, ws.max_row + 1)
        if ws.cell(r, sc).value not in (None, "") or ws.cell(r, dc).value not in (None, "")
    )
    print(name, "filas con sede/denominacion:", n)
