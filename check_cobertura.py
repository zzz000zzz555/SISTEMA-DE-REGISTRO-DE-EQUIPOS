import glob
import openpyxl
from migrate_all import cell, clean, cp_value, header_map

path = glob.glob(r"D:\Descargas\INVENTARIO_EQUIPOS_INFORMATICOS_HH_RED_2024_COMPLETO*.xlsx")[0]
wb = openpyxl.load_workbook(path, data_only=True)
cp_set = set()
total = 0
sin_cp = 0
dup = 0
for sheet in ("COMPUTADORAS-HH", "COMPUTADORAS - PERIFERIE"):
    ws = wb[sheet]
    hm = header_map(ws, 1)
    for r in range(2, ws.max_row + 1):
        cp = cp_value(cell(ws, r, hm, "CP", "CODIGOPATRIMONIAL", "CODPAT"))
        nombre = clean(cell(ws, r, hm, "NOMBREEQUIPO"))
        if not cp and not nombre:
            continue
        total += 1
        if not cp:
            sin_cp += 1
            continue
        if cp in cp_set:
            dup += 1
            continue
        cp_set.add(cp)
print("filas utiles:", total, "sin CP:", sin_cp, "CP duplicados:", dup, "unicos:", len(cp_set))
