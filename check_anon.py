import urllib.request
import urllib.error

lines = open("itam-web/.env.local", encoding="utf-8-sig").read().splitlines()
key = next(l.split("=", 1)[1].strip().strip('"') for l in lines if l.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="))
url = "https://dnqdfruziwwxvpbgtgls.supabase.co/rest/v1/"
for table in [
    "informes_tecnicos",
    "almacen_computo",
    "inventario_monitores",
    "inventario_teclados",
    "inventario_impresoras",
    "inventario_otros",
    "ip_rangos",
    "ip_pronatel",
    "anydesk_emergencia",
    "equipos",
]:
    req = urllib.request.Request(
        url + table + "?select=*&limit=1",
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Prefer": "count=exact",
            "Range": "0-0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            print(table, resp.status, resp.headers.get("content-range"), resp.read().decode()[:90])
    except urllib.error.HTTPError as e:
        print(table, "HTTP", e.code, e.read().decode()[:180])
    except Exception as e:
        print(table, "ERROR", repr(e))
