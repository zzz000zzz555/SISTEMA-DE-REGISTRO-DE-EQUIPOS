SELECT conname, pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = 'public.mantenimientos'::regclass
ORDER BY conname;

SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'mantenimientos'
ORDER BY ordinal_position;
