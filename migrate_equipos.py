import openpyxl, json, urllib.request, time

URL = "https://dnqdfruziwwxvpbgtgls.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRucWRmcnV6aXd3eHZwYmd0Z2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDUwNDY3NSwiZXhwIjoyMTEwMDgwNjc1fQ.0dBQhoLU2n8ooas5HirS7zRHac4ybBBYFueaVv2JF7k"

def api(method, table, data=None, params=""):
    req = urllib.request.Request(f"{URL}/rest/v1/{table}{params}", method=method)
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    if data is not None:
        req.data = json.dumps(data).encode()
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        if "duplicate" not in body.lower():
            print(f"  HTTP {e.code}: {body}")
        return e.code

def clean(v):
    if v is None: return None
    v = str(v).strip()
    return v if v and v.lower() not in ('', 'nan', 'none', 's/n', 'sin serie', 'sin codigo', 's/m', 's/i') else None

def parse_date(v):
    if v is None: return None
    if hasattr(v, 'strftime'):
        return v.strftime('%Y-%m-%d')
    s = str(v).strip()
    if not s or s.lower() in ('', 'nan', 'none'): return None
    return s[:10]

# Map category name to categoria_id
cat_map = {}
def get_cat_id(name):
    if name in cat_map: return cat_map[name]
    # query
    import urllib.request
    req = urllib.request.Request(f"{URL}/rest/v1/categorias?nombre=eq.{name}&select=id_categoria", method="GET")
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            if data:
                cat_map[name] = data[0]['id_categoria']
                return cat_map[name]
    except: pass
    return None

def get_estado_id(name):
    if not name: return None
    name = str(name).strip().upper()
    mapping = {'OPERATIVA': 'Operativo', 'INOPERATIVA': 'Malogrado', 'DE BAJA': 'De Baja', 'MALO': 'Malogrado', 'BUENO': 'Operativo', 'REGULAR': 'Regular'}
    mapped = mapping.get(name, name.title())
    req = urllib.request.Request(f"{URL}/rest/v1/estados_operativos?nombre=eq.{mapped}&select=id_estado", method="GET")
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            if data: return data[0]['id_estado']
    except: pass
    return None

def get_ubicacion_id(area):
    if not area: return None
    area = str(area).strip()
    req = urllib.request.Request(f"{URL}/rest/v1/ubicaciones?area_departamento=eq.{urllib.parse.quote(area)}&select=id_ubicacion", method="GET")
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            if data: return data[0]['id_ubicacion']
    except: pass
    # Try to find any
    req = urllib.request.Request(f"{URL}/rest/v1/ubicaciones?select=id_ubicacion&limit=1", method="GET")
    req.add_header("apikey", KEY)
    req.add_header("Authorization", f"Bearer {KEY}")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            if data: return data[0]['id_ubicacion']
    except: pass
    return None

import urllib.parse

# Get admin user id
req = urllib.request.Request(f"{URL}/rest/v1/usuarios?username=eq.admin&select=id_usuario", method="GET")
req.add_header("apikey", KEY)
req.add_header("Authorization", f"Bearer {KEY}")
with urllib.request.urlopen(req) as resp:
    admin_id = json.loads(resp.read())[0]['id_usuario']

f = r"D:\Descargas\INVENTARIO_EQUIPOS_INFORMATICOS_HH_RED_2024_COMPLETO...xlsx"
wb = openpyxl.load_workbook(f, data_only=True)

total = 0
for sheet_name in ['COMPUTADORAS-HH', 'COMPUTADORAS - PERIFERIE']:
    ws = wb[sheet_name]
    ambito = 'HH' if 'HH' in sheet_name else 'PERIFERIE'
    print(f"Migrating {sheet_name}...")
    batch = []
    for r in range(2, min(ws.max_row + 1, 50)):  # Limit to 50 for now
        cp = ws.cell(row=r, column=2).value
        if cp is None: continue
        cp = str(cp).strip()
        if not cp or cp.lower() in ('', 'nan'): continue

        tipo = clean(ws.cell(row=r, column=3).value) or 'COMPUTADORAS'
        sede = clean(ws.cell(row=r, column=4).value)
        centro_costo = clean(ws.cell(row=r, column=5).value)
        ubicacion = clean(ws.cell(row=r, column=6).value)
        serie = clean(ws.cell(row=r, column=7).value)
        marca = clean(ws.cell(row=r, column=8).value)
        modelo = clean(ws.cell(row=r, column=9).value)
        formato = clean(ws.cell(row=r, column=11).value)
        so = clean(ws.cell(row=r, column=12).value)
        bits = ws.cell(row=r, column=13).value
        procesador = clean(ws.cell(row=r, column=14).value)
        gen = clean(ws.cell(row=r, column=15).value)
        desc_gen = clean(ws.cell(row=r, column=16).value)
        cpu_ghz = ws.cell(row=r, column=17).value
        ram = clean(ws.cell(row=r, column=18).value)
        tipo_ram = clean(ws.cell(row=r, column=19).value)
        disco = clean(ws.cell(row=r, column=20).value)
        tipo_disco = clean(ws.cell(row=r, column=22).value)
        estado_disco = clean(ws.cell(row=r, column=23).value)
        fecha_alta = parse_date(ws.cell(row=r, column=24).value)
        estado = clean(ws.cell(row=r, column=33).value)
        anydesk = clean(ws.cell(row=r, column=35).value)
        rustdesk = clean(ws.cell(row=r, column=36).value)
        obs = clean(ws.cell(row=r, column=37).value)

        cat_id = get_cat_id('PC/Workstation')
        if not cat_id: cat_id = 1
        estado_id = get_estado_id(estado) if estado else None
        if not estado_id: estado_id = 1
        ubi_id = get_ubicacion_id(centro_costo or ubicacion or sede)
        if not ubi_id: ubi_id = 1

        # Build specs JSONB
        specs = {}
        if procesador: specs['procesador'] = procesador
        if gen: specs['generacion'] = gen
        if desc_gen: specs['descripcion_generacion'] = desc_gen
        if cpu_ghz: specs['cpu_ghz'] = float(cpu_ghz) if isinstance(cpu_ghz, (int,float)) else cpu_ghz
        if ram: specs['ram'] = ram
        if tipo_ram: specs['tipo_ram'] = tipo_ram
        if disco: specs['disco'] = disco
        if tipo_disco: specs['tipo_disco'] = tipo_disco
        if estado_disco: specs['estado_disco'] = estado_disco
        if so: specs['sistema_operativo'] = so
        if bits: specs['bits'] = int(bits) if isinstance(bits, (int,float)) else bits

        row = {
            "codigo_patrimonial": cp,
            "codigo_barras": f"BC-{cp}",
            "numero_serie": serie,
            "id_categoria": cat_id,
            "id_marca": None,  # Will be resolved later
            "id_estado": estado_id,
            "id_ubicacion_actual": ubi_id,
            "tipo_conexion": "RJ45 / Wi-Fi",
            "especificaciones_tecnicas": specs,
            "centro_costo": centro_costo,
            "nombre_equipo": clean(ws.cell(row=r, column=11).value),
            "anydesk": anydesk,
            "rustdesk": rustdesk,
            "sistema_operativo": so,
            "bits": int(bits) if isinstance(bits, (int,float)) else None,
            "procesador": procesador,
            "cpu_ghz": float(cpu_ghz) if isinstance(cpu_ghz, (int,float)) else None,
            "ram_gb": None,
            "tipo_ram": tipo_ram,
            "disco_duro": disco,
            "tipo_disco": tipo_disco,
            "estado_disco": estado_disco,
            "fecha_alta": fecha_alta,
            "observaciones": obs,
            "registrado_por": admin_id,
        }
        # Resolve marca
        if marca:
            req = urllib.request.Request(f"{URL}/rest/v1/marcas?nombre=ilike.{urllib.parse.quote(marca)}&select=id_marca", method="GET")
            req.add_header("apikey", KEY)
            req.add_header("Authorization", f"Bearer {KEY}")
            try:
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read())
                    if data:
                        row["id_marca"] = data[0]['id_marca']
            except: pass
        if not row.get("id_marca"):
            row["id_marca"] = 1  # Default to first marca

        batch.append(row)

    # Send in batches of 25
    for i in range(0, len(batch), 25):
        chunk = batch[i:i+25]
        status = api("POST", "equipos", chunk)
        if status in (200, 201, 204):
            total += len(chunk)
        time.sleep(0.5)
    print(f"  {len(batch)} rows processed")

print(f"\nTotal equipos migrated: {total}")