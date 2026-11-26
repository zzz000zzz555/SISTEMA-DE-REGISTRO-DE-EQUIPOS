-- Preparación para migración masiva desde los archivos Excel de referencia.
-- Se eliminan constraints CHECK restrictivos para conservar todos los valores
-- originales de los archivos (la validación se realiza en la interfaz).

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname, conrelid::regclass AS tbl
        FROM pg_constraint
        WHERE contype = 'c'
          AND conrelid::regclass::text IN (
              'informes_tecnicos',
              'almacen_computo',
              'inventario_monitores',
              'inventario_teclados',
              'inventario_impresoras',
              'ip_pronatel',
              'anydesk_emergencia'
          )
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    END LOOP;
END $$;

-- Los datos de estos módulos se recargan completamente desde los Excel.
TRUNCATE TABLE
    public.informes_tecnicos,
    public.almacen_computo,
    public.inventario_monitores,
    public.inventario_teclados,
    public.inventario_impresoras,
    public.inventario_otros,
    public.ip_rangos,
    public.ip_pronatel,
    public.anydesk_emergencia;

-- Limpieza de registros de prueba generados por una migración anterior.
DELETE FROM public.equipos
WHERE codigo_patrimonial ~ '^[0-9]+\.0$'
  AND codigo_barras LIKE 'BC-%';

NOTIFY pgrst, 'reload schema';
