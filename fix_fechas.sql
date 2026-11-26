-- Dos celdas del Excel contienen años inválidos (0206) interpretados como fechas.
ALTER TABLE public.mantenimientos ALTER COLUMN fecha_registro DROP NOT NULL;
UPDATE public.mantenimientos
SET fecha_registro = NULL
WHERE EXTRACT(YEAR FROM fecha_registro) < 1900;

UPDATE public.mantenimientos
SET fecha_evaluacion = NULL
WHERE fecha_evaluacion IS NOT NULL AND EXTRACT(YEAR FROM fecha_evaluacion) < 1900;

UPDATE public.mantenimientos
SET fecha_entrega_usuario = NULL, fecha_finalizacion = NULL
WHERE fecha_entrega_usuario IS NOT NULL AND EXTRACT(YEAR FROM fecha_entrega_usuario) < 1900;

NOTIFY pgrst, 'reload schema';
