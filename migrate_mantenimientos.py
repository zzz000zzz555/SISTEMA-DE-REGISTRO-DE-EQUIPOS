import openpyxl

from migrate_all import cell, clean, cp_value, dt, header_map, insert_batch

wb = openpyxl.load_workbook(r"D:\Descargas\INFORMES_ACTUALIZADA_2025.xlsx", data_only=True)
registros = []

for sheet, header_row, pass_col in (("MTT0_2026", 1, 21), ("MTTO_2025", 4, 20)):
    ws = wb[sheet]
    hm = header_map(ws, header_row)
    for r in range(header_row + 1, ws.max_row + 1):
        sede = clean(cell(ws, r, hm, "SEDE"))
        denominacion = clean(cell(ws, r, hm, "DENOMINACION"))
        if not sede and not denominacion:
            continue

        diagnostico = clean(cell(ws, r, hm, "DIAGNOSTICO"))
        tipo = clean(cell(ws, r, hm, "TIPO DE MANTENIMIENTO"))
        ingreso = dt(cell(ws, r, hm, "FECHA INGRESO"))
        entrega = dt(cell(ws, r, hm, "FECHA ENTREGA AL USUARIO"))

        row = {
            "codigo_patrimonial": cp_value(cell(ws, r, hm, "CP", "COD_PAT")),
            "sede": sede,
            "denominacion": denominacion,
            "tipo_mantenimiento": tipo or "SIN ESPECIFICAR",
            "descripcion_falla": diagnostico or "Sin diagnóstico registrado",
            "trabajo_realizado": clean(cell(ws, r, hm, "SOLUCION")),
            "sugerencia_observacion": clean(cell(ws, r, hm, "SUGERENCIA Y/O OBSERVACION")),
            "estado_servicio": clean(cell(ws, r, hm, "ESTADO")) or "EN_PROCESO",
            "responsable_bien": clean(cell(ws, r, hm, "RESPONSABLE")),
            "anydesk_teamviewer": clean(ws.cell(r, 19).value),
            "rustdesk": clean(ws.cell(r, 20).value) if sheet == "MTT0_2026" else None,
            "contrasena_remota": clean(ws.cell(r, pass_col).value),
            "fecha_evaluacion": dt(cell(ws, r, hm, "FECHA DE EVALUACION")),
            "fecha_entrega_usuario": entrega,
            "fecha_finalizacion": entrega,
            "solucion": clean(cell(ws, r, hm, "SOLUCION")),
        }
        if ingreso:
            row["fecha_registro"] = ingreso
        for k in list(row):
            if row[k] is None:
                del row[k]
        registros.append(row)

print(f"Mantenimientos preparados: {len(registros)}", flush=True)
print(f"Insertados: {insert_batch('mantenimientos', registros)}", flush=True)
