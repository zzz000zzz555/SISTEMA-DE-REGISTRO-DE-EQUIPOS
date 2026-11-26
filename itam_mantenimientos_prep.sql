-- Preparación para migrar las hojas MTTO de INFORMES_ACTUALIZADA_2025.xlsx.
-- Se conservan los valores originales de estado y tipo, por lo que se retiran
-- los CHECK que limitaban el catálogo a cuatro valores.

ALTER TABLE public.mantenimientos
    DROP CONSTRAINT IF EXISTS mantenimientos_estado_servicio_check,
    DROP CONSTRAINT IF EXISTS mantenimientos_tipo_mantenimiento_check,
    ALTER COLUMN id_equipo DROP NOT NULL,
    ALTER COLUMN id_tecnico_responsable DROP NOT NULL;

ALTER TABLE public.mantenimientos
    ADD COLUMN IF NOT EXISTS codigo_patrimonial text,
    ADD COLUMN IF NOT EXISTS sede text,
    ADD COLUMN IF NOT EXISTS denominacion text;

-- Los 3 registros existentes son datos de prueba del despliegue anterior.
TRUNCATE TABLE public.mantenimientos;

NOTIFY pgrst, 'reload schema';
