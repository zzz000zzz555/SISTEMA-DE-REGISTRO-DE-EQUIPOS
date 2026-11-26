SELECT id_equipo, codigo_patrimonial, nombre_equipo, id_categoria, fecha_registro
FROM public.equipos
WHERE fecha_registro < '2026-11-20'
ORDER BY codigo_patrimonial;
