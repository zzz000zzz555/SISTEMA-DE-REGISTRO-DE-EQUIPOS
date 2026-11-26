-- Registros de demostración creados por la versión inicial (2026-11-12 20:37:58).
-- Los datos migrados del Excel usan códigos patrimoniales numéricos.
DELETE FROM public.equipos
WHERE id_equipo IN (
  'b2ba1992-89b7-4d7f-b5e1-8ca5ac912a21',
  '948cc7ca-774d-478a-9133-8bbf058aacaf',
  '21b8db6f-43da-4532-989f-51c760d8d8e9',
  'f606b01d-9dc4-4f25-9e08-fbb7aaa6f571',
  '2af640cb-087a-4c99-9865-adfe481a1263',
  'd751fda1-658b-4390-8165-c827f6c222b1'
);

SELECT count(*) AS total_equipos FROM public.equipos;
