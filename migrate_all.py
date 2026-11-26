import openpyxl
import json
import re
import unicodedata
import urllib.error
import urllib.request
from datetime import date, datetime

URL = "https://dnqdfruziwwxvpbgtgls.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucWRmcnV6aXd3eHZwYmd0Z2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDUwNDY3NSwiZXhwIjoyMTEwMDgwNjc1fQ.0dBQhoLU2n8ooas5HirS7zRHac4ybBBYFueaVv2JF7k"

ERRORS = []


def api(method, table, data=None, params=""):
    req = urllib.request.Request(f"{URL}/rest/v1/{table}{params}", method=method)
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    if data is not None:
        req.data = json.dumps(data, ensure_ascii=False).encode("utf-8")
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:240]
        if len(ERRORS) < 12:
            ERRORS.append(f"{table} HTTP {e.code}: {body}")
        return e.code
    except Exception as e:
        if len(ERRORS) < 12:
            ERRORS.append(f"{table} ERROR: {e}")
        return 0


def insert_batch(table, rows, batch_size=80):
    ok = 0
    for i in range(0, len(rows), batch_size):
        chunk = rows[i:i + batch_size]
        status = api("POST", table, chunk)
        if status in (200, 201, 204):
            ok += len(chunk)
        else:
            for row in chunk:
                if api("POST", table, [row]) in (200, 201, 204):
                    ok += 1
        if (i // batch_size) % 5 == 0:
            print(f"    {table}: {min(i + batch_size, len(rows))}/{len(rows)}", flush=True)
    return ok


PLACEHOLDERS = {"", "N/A", "NA", "S/N", "SN", "S/M", "S/C", "S/I", "SIN SERIE", "SIN CODIGO", "SIN MODELO", "NONE", "NAN", "-", "--", "NO APLICA", "0"}


def clean(v):
    if v is None:
        return None
    if isinstance(v, bool):
        return "SI" if v else "NO"
    s = str(v).strip()
    if s.upper() in PLACEHOLDERS:
        return None
    return s[:490]


def norm(v):
    s = "" if v is None else str(v)
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^A-Z0-9]", "", s.upper())


def num(v):
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace(",", ".")
    m = re.search(r"-?\d+(?:\.\d+)?", s)
    return float(m.group()) if m else None


def integer(v):
    n = num(v)
    return int(n) if n is not None else None


def dt(v):
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, (datetime, date)):
        if isinstance(v, datetime) and v.year < 1900:
            return None
        return v.strftime("%Y-%m-%d")
    if isinstance(v, (int, float)):
        return None
    s = str(v).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s[:10], fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


def flag(v):
    s = norm(v)
    if s == "SI":
        return True
    if s == "NO":
        return False
    return None


def cp_value(v):
    c = clean(v)
    if c is None:
        return None
    n = num(c)
    if n is not None and float(n).is_integer():
        return str(int(n))
    return c[:50]


def header_map(ws, row):
    result = {}
    for c in range(1, ws.max_column + 1):
        key = norm(ws.cell(row=row, column=c).value)
        if key and key not in result:
            result[key] = c
    return result


def cell(ws, r, hm, *aliases):
    for alias in aliases:
        c = hm.get(norm(alias))
        if c:
            v = ws.cell(row=r, column=c).value
            if v is not None:
                return v
    return None


def octets(values):
    nums = [num(v) for v in values]
    if any(n is None for n in nums):
        return None
    return ".".join(str(int(n)) for n in nums)


def main():
    wb_eq = openpyxl.load_workbook(
        r"D:\Descargas\INVENTARIO_EQUIPOS_INFORMATICOS_HH_RED_2024_COMPLETO...xlsx",
        data_only=True,
    )
    wb_inf = openpyxl.load_workbook(r"D:\Descargas\INFORMES_ACTUALIZADA_2025.xlsx", data_only=True)
    wb_ip = openpyxl.load_workbook(r"D:\Descargas\INVENTARIO IP FINAL FINAL.xlsx", data_only=True)

    req = urllib.request.Request(f"{URL}/rest/v1/marcas?select=id_marca,nombre", method="GET")
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        marcas = json.loads(resp.read())
    marca_ids = {}
    for m in marcas:
        marca_ids[norm(m["nombre"])] = m["id_marca"]

    req = urllib.request.Request(
        f"{URL}/rest/v1/usuarios?select=id_usuario&username=eq.admin", method="GET"
    )
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        usuarios_admin = json.loads(resp.read())
    if not usuarios_admin:
        raise RuntimeError("No existe el usuario admin para registrado_por")
    admin_id = usuarios_admin[0]["id_usuario"]
    print(f"Usuario registrador: admin ({admin_id})", flush=True)

    # ---------------------------------------------------------------- 3.1 COMPUTADORAS
    equipos = []
    usados_cp = set()
    usados_serie = set()
    for sheet in ("COMPUTADORAS-HH", "COMPUTADORAS - PERIFERIE"):
        ws = wb_eq[sheet]
        hm = header_map(ws, 1)
        for r in range(2, ws.max_row + 1):
            cp = cp_value(cell(ws, r, hm, "CP", "CODIGOPATRIMONIAL", "CODPAT"))
            nombre = clean(cell(ws, r, hm, "NOMBREEQUIPO"))
            if not cp and not nombre:
                continue
            if not cp:
                cp = f"S/C-{sheet[:3].upper()}-{r}"
            if cp in usados_cp:
                continue
            usados_cp.add(cp)

            serie = clean(cell(ws, r, hm, "SERIE"))
            if serie and (norm(serie) in usados_serie or len(serie) > 100):
                serie = None
            if serie:
                usados_serie.add(norm(serie))

            marca_txt = clean(cell(ws, r, hm, "MARCA")) or ""
            id_marca = 1
            for key, mid in marca_ids.items():
                if key and (key == norm(marca_txt) or key in norm(marca_txt)):
                    id_marca = mid
                    break

            estado_txt = norm(cell(ws, r, hm, "ESTADO"))
            id_estado = 4 if any(x in estado_txt for x in ("INOPERATIVA", "BAJA", "MALO")) else 2

            specs = {}
            procesador = clean(cell(ws, r, hm, "PROCESADOR"))
            generacion = clean(cell(ws, r, hm, "GENERACION"))
            desc_gen = clean(cell(ws, r, hm, "DESCRIPCIONGENERACION"))
            cpu = num(cell(ws, r, hm, "CPUGHZ"))
            ram = clean(cell(ws, r, hm, "CAPACIDADRAMGB", "CAPACIDADDE RAMGB"))
            ram_num = num(ram)
            tipo_ram = clean(cell(ws, r, hm, "TIPORAM"))
            disco = clean(cell(ws, r, hm, "DISCODURO"))
            tipo_disco = clean(cell(ws, r, hm, "TIPODISCO", "TIPODISCODURO"))
            estado_disco = clean(cell(ws, r, hm, "ESTADODISCO", "ESTADODISCODURO"))
            so = clean(cell(ws, r, hm, "SISTEMAOPERATIVO"))
            bits = integer(cell(ws, r, hm, "BITS"))
            for k, v in (
                ("procesador", procesador), ("generacion", generacion),
                ("descripcion_generacion", desc_gen), ("cpu_ghz", cpu),
                ("ram", ram), ("tipo_ram", tipo_ram), ("disco", disco),
                ("tipo_disco", tipo_disco), ("estado_disco", estado_disco),
                ("sistema_operativo", so), ("bits", bits),
            ):
                if v is not None:
                    specs[k] = v

            equipos.append({
                "codigo_patrimonial": cp,
                "codigo_barras": f"BC-{cp}"[:50],
                "numero_serie": serie,
                "id_categoria": 4,
                "id_marca": id_marca,
                "id_estado": id_estado,
                "id_ubicacion_actual": 1,
                "registrado_por": admin_id,
                "centro_costo": clean(cell(ws, r, hm, "CENTRODECOSTO")),
                "nombre_equipo": nombre,
                "sistema_operativo": so,
                "bits": bits,
                "procesador": procesador,
                "generacion": generacion,
                "descripcion_generacion": desc_gen,
                "cpu_ghz": cpu,
                "velocidad_cpu_ghz": cpu,
                "ram_gb": ram_num,
                "tipo_ram": tipo_ram,
                "disco_duro": disco,
                "tipo_disco": tipo_disco,
                "estado_disco": estado_disco,
                "fecha_donacion": dt(cell(ws, r, hm, "FECHADONACION")),
                "fecha_alta": dt(cell(ws, r, hm, "FECHAALTA")),
                "fecha_repotechnacion": dt(cell(ws, r, hm, "FECHADEREPOTENCIACION")),
                "fecha_baja": dt(cell(ws, r, hm, "FECHADEBAJA")),
                "dominio": clean(cell(ws, r, hm, "DOMINIO")),
                "anydesk": clean(cell(ws, r, hm, "ANYDESK")),
                "rustdesk": clean(cell(ws, r, hm, "RUSTDESK")),
                "observaciones": clean(cell(ws, r, hm, "OBSERVACION")),
                "informacion_tecnico": clean(cell(ws, r, hm, "INFORTECNICO", "INFORMACIONTECNICO")),
                "especificaciones_tecnicas": specs,
            })
    print(f"3.1 Computadoras: {len(equipos)} filas preparadas", flush=True)
    print(f"  insertadas: {insert_batch('equipos', equipos)}", flush=True)

    # ---------------------------------------------------------------- 3.2 MONITORES
    monitores = []

    def add_monitor(amb, actual, item, cp, sede, cc, ubi, marca, modelo, serie, res, pulg, estado, cons, alta, baja, obs):
        cp = cp_value(cp)
        if not any([cp, marca, modelo, serie, obs]):
            return
        monitores.append({
            "ambito": amb, "actualizado": bool(actual) if isinstance(actual, bool) else False,
            "item": integer(item), "codigo_patrimonial": cp, "sede_red": clean(sede),
            "centro_costo": clean(cc), "ubicacion_fisica": clean(ubi), "marca": clean(marca),
            "modelo": clean(modelo), "serie": clean(serie), "resolucion": clean(res),
            "pulgadas": clean(pulg), "estado": clean(estado), "estado_conservacion": clean(cons),
            "fecha_alta": dt(alta), "fecha_baja": dt(baja), "observaciones": clean(obs),
        })

    ws = wb_eq["MONITORES - HH"]
    for r in range(2, ws.max_row + 1):
        add_monitor("HH", ws.cell(r, 1).value, ws.cell(r, 2).value, ws.cell(r, 3).value,
                    ws.cell(r, 4).value, ws.cell(r, 5).value, ws.cell(r, 6).value,
                    ws.cell(r, 7).value, ws.cell(r, 8).value, ws.cell(r, 9).value,
                    ws.cell(r, 10).value, ws.cell(r, 11).value, ws.cell(r, 12).value,
                    None, ws.cell(r, 13).value, ws.cell(r, 14).value, ws.cell(r, 15).value)
    ws = wb_eq["MONITORES - PERIFERIE"]
    hm = header_map(ws, 1)
    for r in range(2, ws.max_row + 1):
        add_monitor("PERIFERIE", None, None, ws.cell(r, 1).value, None,
                    ws.cell(r, 3).value, ws.cell(r, 4).value, ws.cell(r, 6).value,
                    ws.cell(r, 5).value, ws.cell(r, 7).value, None, None, None,
                    ws.cell(r, 9).value, ws.cell(r, 8).value, ws.cell(r, 10).value,
                    ws.cell(r, 11).value)
    print(f"3.2 Monitores: {len(monitores)} filas preparadas", flush=True)
    print(f"  insertados: {insert_batch('inventario_monitores', monitores)}", flush=True)

    # ---------------------------------------------------------------- 3.3 TECLADOS
    teclados = []

    def add_teclado(amb, actual, item, cp, sede, micro, cc, eess, ubi, servicio, marca, modelo, serie, alta, cons, baja, obs):
        cp = cp_value(cp)
        if not any([cp, marca, modelo, serie, obs]):
            return
        teclados.append({
            "ambito": amb, "actualizado": bool(actual) if isinstance(actual, bool) else False,
            "item": integer(item), "codigo_patrimonial": cp, "sede": clean(sede),
            "microred": clean(micro), "centro_costo": clean(cc), "eess": clean(eess),
            "ubicacion_fisica": clean(ubi), "servicio": clean(servicio), "marca": clean(marca),
            "modelo": clean(modelo), "serie": clean(serie), "fecha_alta": dt(alta),
            "estado_conservacion": clean(cons), "fecha_baja": dt(baja), "observaciones": clean(obs),
        })

    ws = wb_eq["TECLADO - HH"]
    for r in range(2, ws.max_row + 1):
        add_teclado("HH", ws.cell(r, 1).value, ws.cell(r, 2).value, ws.cell(r, 3).value,
                    ws.cell(r, 4).value, None, ws.cell(r, 5).value, None,
                    ws.cell(r, 6).value, None, ws.cell(r, 7).value, ws.cell(r, 8).value,
                    ws.cell(r, 9).value, ws.cell(r, 10).value, None, ws.cell(r, 11).value,
                    ws.cell(r, 12).value)
    ws = wb_eq["TECLADO - PERIFERIE"]
    for r in range(2, ws.max_row + 1):
        add_teclado("PERIFERIE", None, None, ws.cell(r, 1).value, None, ws.cell(r, 2).value,
                    None, ws.cell(r, 3).value, None, ws.cell(r, 4).value,
                    ws.cell(r, 5).value, ws.cell(r, 6).value, ws.cell(r, 7).value,
                    ws.cell(r, 8).value, ws.cell(r, 9).value, ws.cell(r, 10).value,
                    ws.cell(r, 11).value)
    print(f"3.3 Teclados: {len(teclados)} filas preparadas", flush=True)
    print(f"  insertados: {insert_batch('inventario_teclados', teclados)}", flush=True)

    # ---------------------------------------------------------------- 3.4 IMPRESORAS
    impresoras = []

    def add_impresora(amb, actual, item, cp, sede, cc, ubi, marca, modelo, serie, tipo, insumo,
                      uso, cons, estado, cond, garantia, alta, baja, obs, informe):
        cp = cp_value(cp)
        if not any([cp, marca, modelo, serie, obs]):
            return
        impresoras.append({
            "ambito": amb, "actualizado": bool(actual) if isinstance(actual, bool) else False,
            "item": integer(item), "codigo_patrimonial": cp, "sede": clean(sede),
            "centro_costo": clean(cc), "ubicacion_fisica": clean(ubi), "marca": clean(marca),
            "modelo": clean(modelo), "serie": clean(serie), "tipo_impresora": clean(tipo),
            "insumo": clean(insumo), "uso_insumos_mes": clean(uso), "estado": clean(estado),
            "estado_conservacion": clean(cons), "condicion_propiedad": clean(cond),
            "fecha_garantia": dt(garantia), "fecha_alta": dt(alta), "fecha_baja": dt(baja),
            "observacion": clean(obs), "informe_tecnico": clean(informe),
        })

    ws = wb_eq["IMPRESORAS - HH"]
    for r in range(2, ws.max_row + 1):
        add_impresora("HH", ws.cell(r, 1).value, ws.cell(r, 2).value, ws.cell(r, 3).value,
                      ws.cell(r, 4).value, ws.cell(r, 5).value, ws.cell(r, 6).value,
                      ws.cell(r, 7).value, ws.cell(r, 8).value, ws.cell(r, 9).value,
                      ws.cell(r, 10).value, ws.cell(r, 11).value, None, None,
                      ws.cell(r, 12).value, ws.cell(r, 14).value, None,
                      ws.cell(r, 13).value, ws.cell(r, 16).value, ws.cell(r, 15).value,
                      ws.cell(r, 17).value)
    ws = wb_eq["IMPRESORAS-PERIFERIE"]
    for r in range(2, ws.max_row + 1):
        add_impresora("PERIFERIE", None, None, ws.cell(r, 1).value, ws.cell(r, 2).value,
                      ws.cell(r, 3).value, ws.cell(r, 4).value, ws.cell(r, 5).value,
                      ws.cell(r, 6).value, ws.cell(r, 7).value, ws.cell(r, 8).value,
                      ws.cell(r, 9).value, ws.cell(r, 10).value, ws.cell(r, 13).value,
                      None, None, ws.cell(r, 11).value, ws.cell(r, 12).value,
                      ws.cell(r, 14).value, ws.cell(r, 15).value, None)
    print(f"3.4 Impresoras: {len(impresoras)} filas preparadas", flush=True)
    print(f"  insertados: {insert_batch('inventario_impresoras', impresoras)}", flush=True)

    # ---------------------------------------------------------------- 3.5 OTROS EQUIPOS
    ws = wb_eq["OTROS EQUIPOS"]
    otros = []
    for r in range(2, ws.max_row + 1):
        cp = cp_value(ws.cell(r, 1).value)
        tipo = clean(ws.cell(r, 2).value)
        if not cp and not tipo:
            continue
        otros.append({
            "codigo_patrimonial": cp, "tipo": tipo, "sede": clean(ws.cell(r, 3).value),
            "centro_costo": clean(ws.cell(r, 4).value),
            "ubicacion_fisica": clean(ws.cell(r, 5).value),
            "marca": clean(ws.cell(r, 6).value), "serie": clean(ws.cell(r, 7).value),
            "modelo": clean(ws.cell(r, 8).value), "observacion": clean(ws.cell(r, 9).value),
            "fecha_alta": dt(ws.cell(r, 10).value),
        })
    print(f"3.5 Otros equipos: {len(otros)} filas preparadas", flush=True)
    print(f"  insertados: {insert_batch('inventario_otros', otros)}", flush=True)

    # ---------------------------------------------------------------- 1.1 INFORMES TECNICOS
    informes = []
    for sheet, header_row in (("INFORMES_2026", 1), ("INFORMES_2025", 4)):
        ws = wb_inf[sheet]
        hm = header_map(ws, header_row)
        for r in range(header_row + 1, ws.max_row + 1):
            denominacion = clean(cell(ws, r, hm, "DENOMINACION"))
            sede = clean(cell(ws, r, hm, "SEDE"))
            if not denominacion and not sede:
                continue
            informes.append({
                "numero_item": integer(ws.cell(r, 1).value) or r,
                "codigo_patrimonial": cp_value(cell(ws, r, hm, "CP", "CODIGOPATRIMONIAL") or ws.cell(r, 2).value),
                "sede": sede or "SIN SEDE",
                "centro_costo": clean(cell(ws, r, hm, "CENTRODECOSTO")),
                "ubicacion_fisica": clean(cell(ws, r, hm, "UBICACIONFISICA")),
                "denominacion": denominacion or "SIN DENOMINACION",
                "marca": clean(cell(ws, r, hm, "MARCA")),
                "modelo": clean(cell(ws, r, hm, "MODELO")),
                "serie": clean(cell(ws, r, hm, "SERIE")),
                "problema_reportado": clean(cell(ws, r, hm, "PROBLEMAREPORTADOPORELUSUARIO")),
                "diagnostico": clean(cell(ws, r, hm, "DIAGNOSTICO")),
                "estado_conservacion": clean(cell(ws, r, hm, "ESTADODECONSERVACION")),
                "pruebas_realizadas": clean(cell(ws, r, hm, "PRUEBASREALIZADAS")),
                "observacion": clean(cell(ws, r, hm, "OBSERVACION")),
                "baja_tecnica": flag(cell(ws, r, hm, "BAJATECNICA", "BAJATECNICASINO")),
                "fecha_alta": dt(cell(ws, r, hm, "FECHADEALTA")),
                "garantia": flag(cell(ws, r, hm, "GARANTIASINO", "GARANTIA")),
                "tipo_mantenimiento": clean(cell(ws, r, hm, "TIPODEMANTENIMIENTO")),
                "estado_bien": clean(cell(ws, r, hm, "ESTADODELBIEN")),
                "responsable_evaluacion": clean(cell(ws, r, hm, "RESPONSABLEDELAEVALUACION")),
                "fecha_ingreso": dt(cell(ws, r, hm, "FECHAINGRESO")),
                "fecha_evaluacion": dt(cell(ws, r, hm, "FECHAEVALUACION")),
                "fecha_entrega": dt(cell(ws, r, hm, "FECHAENTREGA")),
                "numero_informe": clean(cell(ws, r, hm, "INFORMEN")),
            })
    print(f"1.1 Informes técnicos: {len(informes)} filas preparadas", flush=True)
    print(f"  insertados: {insert_batch('informes_tecnicos', informes)}", flush=True)

    # ---------------------------------------------------------------- 1.3 ALMACEN DE COMPUTO
    ws = wb_inf["ALMACEN_COMPUTO"]
    hm = header_map(ws, 1)
    almacen = []
    for r in range(2, ws.max_row + 1):
        tipo = clean(ws.cell(r, 3).value)
        sede = clean(cell(ws, r, hm, "SEDE"))
        if not tipo and not sede:
            continue
        almacen.append({
            "numero_item": integer(ws.cell(r, 1).value) or r,
            "codigo_patrimonial": cp_value(cell(ws, r, hm, "CP")),
            "tipo_equipo": tipo or "OTRO",
            "sede_origen": sede,
            "centro_costo_origen": clean(cell(ws, r, hm, "CENTRODECOSTO")),
            "ubicacion_fisica_origen": clean(cell(ws, r, hm, "UBICACIONFISICA")),
            "numero_serie": clean(cell(ws, r, hm, "NSERIE")),
            "modelo": clean(cell(ws, r, hm, "MODELO")),
            "marca": clean(cell(ws, r, hm, "MARCA")),
            "fecha_ingreso": dt(cell(ws, r, hm, "FECHADEINGRESO")) or "1900-01-01",
            "observacion_ingreso": clean(ws.cell(r, 11).value),
            "estado_ingreso": clean(ws.cell(r, 12).value),
            "responsable_registro_ingreso": clean(ws.cell(r, 13).value),
            "sede_destino": clean(ws.cell(r, 14).value),
            "centro_costo_destino": clean(ws.cell(r, 15).value),
            "ubicacion_destino": clean(ws.cell(r, 16).value),
            "fecha_salida": dt(ws.cell(r, 17).value),
            "estado_equipo_salida": clean(ws.cell(r, 18).value),
            "responsable_recibe": clean(ws.cell(r, 19).value),
            "documento_sustento": clean(ws.cell(r, 20).value),
            "condicion_prestamo": clean(ws.cell(r, 21).value),
            "responsable_registro_salida": clean(ws.cell(r, 22).value),
            "observacion_salida": clean(ws.cell(r, 23).value),
            "fecha_cierre_retorno": dt(ws.cell(r, 24).value),
        })
    print(f"1.3 Almacén de cómputo: {len(almacen)} filas preparadas", flush=True)
    print(f"  insertados: {insert_batch('almacen_computo', almacen)}", flush=True)

    # ---------------------------------------------------------------- 2.2 RANGOS IP
    ws = wb_ip["IP ACTUAL"]
    rangos = []
    for r in range(1, ws.max_row + 1):
        for c in range(1, ws.max_column + 1):
            v = ws.cell(r, c).value
            if not v:
                continue
            m = re.search(r"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s*-\s*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", str(v))
            if not m:
                continue
            area = clean(ws.cell(r, c - 1).value) if c > 1 else None
            if not area:
                area = clean(ws.cell(r - 1, c).value)
            if not area:
                continue
            cant = num(ws.cell(r, c + 1).value)
            rangos.append({
                "bloque_edificio": "BLOQUE 2",
                "area_oficina": area[:120],
                "ip_inicio": m.group(1),
                "ip_fin": m.group(2),
                "cantidad_asignada": int(cant) if cant is not None else None,
                "detalle_equipos": clean(ws.cell(r, c + 3).value),
            })
            break
    print(f"2.2 Rangos IP: {len(rangos)} filas preparadas", flush=True)
    print(f"  insertados: {insert_batch('ip_rangos', rangos)}", flush=True)

    # ---------------------------------------------------------------- 2.3 IP PRONATEL
    ws = wb_ip.worksheets[6]
    pronatel = []
    for start in (3, 12, 21, 30):
        sede = clean(ws.cell(start, 3).value)
        if not sede:
            continue
        for base in (3, 8, 13, 18):
            nombre = clean(ws.cell(start, base).value)
            if not nombre:
                continue
            ip = octets([ws.cell(start + 1, base + k).value for k in range(4)])
            mask = octets([ws.cell(start + 2, base + k).value for k in range(4)])
            pg = octets([ws.cell(start + 3, base + k).value for k in range(4)])
            dns1 = octets([ws.cell(start + 5, base + k).value for k in range(4)])
            dns2 = octets([ws.cell(start + 6, base + k).value for k in range(4)])
            if not ip:
                continue
            octs = [int(x) for x in ip.split(".")]
            mobs = [int(x) for x in mask.split(".")] if mask else [None] * 4
            pobs = [int(x) for x in pg.split(".")] if pg else [None] * 4
            pronatel.append({
                "establecimiento_salud": nombre[:150],
                "tipo_enlace": "IP PRONATEL",
                "ip_completa": ip,
                "ip_oct1": octs[0], "ip_oct2": octs[1], "ip_oct3": octs[2], "ip_oct4": octs[3],
                "mascara_completa": mask,
                "mascara_oct1": mobs[0], "mascara_oct2": mobs[1], "mascara_oct3": mobs[2], "mascara_oct4": mobs[3],
                "puerta_enlace_completa": pg,
                "pg_oct1": pobs[0], "pg_oct2": pobs[1], "pg_oct3": pobs[2], "pg_oct4": pobs[3],
                "dns_primario": dns1, "dns_secundario": dns2,
                "observaciones": sede,
            })
    print(f"2.3 IP PRONATEL: {len(pronatel)} filas preparadas", flush=True)
    print(f"  insertados: {insert_batch('ip_pronatel', pronatel)}", flush=True)

    # ---------------------------------------------------------------- 2.4 ANYDESK EMERGENCIA
    ws = wb_ip["Anydesk Emergen"]
    anydesk = []
    for r in range(2, ws.max_row + 1):
        aid = clean(ws.cell(r, 6).value)
        ubi = clean(ws.cell(r, 4).value)
        if not aid or not ubi:
            continue
        anydesk.append({
            "numero": integer(ws.cell(r, 1).value) or r,
            "tipo": clean(ws.cell(r, 2).value) or "CPU",
            "codigo_patrimonial": cp_value(ws.cell(r, 3).value),
            "ubicacion": ubi,
            "nombre_equipo": clean(ws.cell(r, 5).value),
            "anydesk_id": aid.replace(" ", "")[:50],
            "estado_verificacion": "VERIFICADO",
        })
    print(f"2.4 AnyDesk emergencia: {len(anydesk)} filas preparadas", flush=True)
    print(f"  insertados: {insert_batch('anydesk_emergencia', anydesk)}", flush=True)

    print("\n=== ERRORES ===", flush=True)
    if ERRORS:
        for e in ERRORS:
            print(e, flush=True)
    else:
        print("Sin errores", flush=True)


if __name__ == "__main__":
    main()
