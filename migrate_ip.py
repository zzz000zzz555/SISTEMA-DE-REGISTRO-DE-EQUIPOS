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
        print(f"  HTTP {e.code}: {e.read().decode()[:200]}")
        return e.code

f = r"D:\Descargas\INVENTARIO IP FINAL FINAL.xlsx"
wb = openpyxl.load_workbook(f, data_only=True)

total = 0
for sheet_name in ['IP 0', 'IP 1', 'IP 2', 'IP 3']:
    ws = wb[sheet_name]
    subred = sheet_name.replace("IP ", "")
    print(f"Migrating {sheet_name}...")
    batch = []
    for r in range(2, ws.max_row + 1):
        estado = ws.cell(row=r, column=2).value
        if not estado:
            continue
        estado = str(estado).strip().upper()
        if estado not in ('LIBRE', 'OCUPADO', 'RESERVADO'):
            continue
        ip_fija = ws.cell(row=r, column=14).value
        if ip_fija is None:
            continue
        try:
            ip_fija = int(float(ip_fija))
        except:
            continue
        if ip_fija < 1 or ip_fija > 254:
            continue

        cp = ws.cell(row=r, column=5).value
        if cp is not None:
            cp = str(int(float(cp))) if isinstance(cp, (int, float)) else str(cp).strip()
        else:
            cp = None

        def clean(v):
            if v is None: return None
            v = str(v).strip()
            return v if v else None

        anydesk = clean(ws.cell(row=r, column=16).value)
        if anydesk:
            anydesk = anydesk.replace(" ", "")

        row = {
            "subred_tab": "IP" + subred,
            "octeto_1": 172,
            "octeto_2": 16,
            "octeto_3": int(subred),
            "octeto_4": ip_fija,
            "ip_completa": f"172.16.{subred}.{ip_fija}",
            "estado": estado,
            "tipo_dispositivo": clean(ws.cell(row=r, column=3).value),
            "fisico_virtual": clean(ws.cell(row=r, column=4).value),
            "codigo_patrimonial": cp,
            "ubicacion": clean(ws.cell(row=r, column=6).value),
            "marca": clean(ws.cell(row=r, column=7).value),
            "nombre_equipo": clean(ws.cell(row=r, column=8).value),
            "usuario_windows": clean(ws.cell(row=r, column=9).value),
            "actualizado": bool(ws.cell(row=r, column=15).value),
            "anydesk": anydesk,
            "rustdesk": clean(ws.cell(row=r, column=17).value),
            "clave_anydesk": clean(ws.cell(row=r, column=18).value),
            "personal_asignado": clean(ws.cell(row=r, column=19).value),
            "observacion": clean(ws.cell(row=r, column=20).value),
        }
        batch.append(row)

    # Send in batches of 50
    for i in range(0, len(batch), 50):
        chunk = batch[i:i+50]
        # Use PATCH (upsert) per row since ip_completa is unique
        for row in chunk:
            params = f"?ip_completa=eq.{row['ip_completa']}"
            status = api("PATCH", "ip_inventario", row, params)
            if status not in (200, 204):
                # Try insert if not exists
                api("POST", "ip_inventario", row)
        if status in (200, 201, 204):
            total += len(chunk)
        time.sleep(0.5)
    print(f"  {len(batch)} rows processed")

print(f"\nTotal IP rows migrated: {total}")