-- ============================================================================
-- SEGURIDAD: AUDITORIA DE SESIONES + RLS + PERMISOS DELEGABLES
-- ============================================================================

-- Tabla de auditoria de sesiones
CREATE TABLE IF NOT EXISTS public.auditoria_sesiones (
    id_sesion_audit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    fecha_hora_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_hora_fin TIMESTAMPTZ,
    ip_publica VARCHAR(45),
    ciudad VARCHAR(120),
    region VARCHAR(120),
    pais VARCHAR(120),
    latitud NUMERIC(9,6),
    longitud NUMERIC(9,6),
    user_agent TEXT,
    so_navegador VARCHAR(200),
    dispositivo VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA','CERRADA','EXPIRADA')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audses_usuario ON public.auditoria_sesiones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_audses_fecha ON public.auditoria_sesiones(fecha_hora_inicio);

-- Permiso delegable: ver_auditoria_sesiones y gestionar_roles_permisos
-- Insertar permisos si no existen (modulo Seguridad)
INSERT INTO public.modulos_sistema (codigo_modulo, nombre_modulo, descripcion, ruta_endpoint, icono, orden_visual, activo)
VALUES ('MOD_SEGURIDAD', 'Seguridad y Auditoría', 'Auditoría de sesiones y gestión de roles', '/seguridad', 'shield', 6, true)
ON CONFLICT (codigo_modulo) DO NOTHING;

INSERT INTO public.permisos (id_modulo, codigo_permiso, nombre_permiso, accion, descripcion)
SELECT m.id_modulo, p.codigo, p.nombre, p.accion, p.descr
FROM public.modulos_sistema m
CROSS JOIN (VALUES
  ('VER_AUDITORIA_SESIONES', 'Ver Auditoría de Sesiones', 'VER', 'Ver IP y ubicación de sesiones (solo Jefe)'),
  ('GESTIONAR_ROLES_PERMISOS', 'Administrar Roles, Módulos y Permisos', 'APROBAR', 'Delegable: crear módulos, roles y asignar permisos')
) AS p(codigo, nombre, accion, descr)
WHERE m.codigo_modulo = 'MOD_SEGURIDAD'
ON CONFLICT (codigo_permiso) DO NOTHING;

-- Asignar ambos permisos al rol Jefe (si existe) o Super Administrador
INSERT INTO public.roles_permisos (id_rol, id_permiso, activo)
SELECT r.id_rol, p.id_permiso, true
FROM public.roles r
CROSS JOIN public.permisos p
WHERE r.nombre_rol IN ('Jefe', 'Super Administrador')
  AND p.codigo_permiso IN ('VER_AUDITORIA_SESIONES', 'GESTIONAR_ROLES_PERMISOS')
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

-- Funcion helper: verificar si un usuario tiene un permiso
CREATE OR REPLACE FUNCTION public.fn_usuario_tiene_permiso(p_id_usuario UUID, p_codigo_permiso TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.roles r ON r.id_rol = u.id_rol
    JOIN public.roles_permisos rp ON rp.id_rol = r.id_rol
    JOIN public.permisos p ON p.id_permiso = rp.id_permiso
    WHERE u.id_usuario = p_id_usuario
      AND u.estado_cuenta = 'ACTIVO'
      AND (u.fecha_finalizacion IS NULL OR u.fecha_finalizacion > now())
      AND r.activo = true
      AND (r.fecha_finalizacion IS NULL OR r.fecha_finalizacion > now())
      AND rp.activo = true
      AND (rp.fecha_finalizacion IS NULL OR rp.fecha_finalizacion > now())
      AND p.codigo_permiso = p_codigo_permiso
  );
END;
$$;

-- RLS: habilitar en tablas criticas
ALTER TABLE public.auditoria_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mantenimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_tokens ENABLE ROW LEVEL SECURITY;

-- Politicas permisivas para anon (la app usa anon key; la seguridad real esta en la app + RPC)
-- Para produccion real, reemplazar por politicas basadas en auth.uid()
CREATE POLICY "anon_select_all" ON public.usuarios FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.roles FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.permisos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.roles_permisos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.modulos_sistema FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.equipos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.historial_movimientos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.mantenimientos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.auditoria_sistema FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.sesiones_tokens FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_all" ON public.auditoria_sesiones FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_all" ON public.usuarios FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.roles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.permisos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.roles_permisos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.modulos_sistema FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.equipos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.historial_movimientos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.mantenimientos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.auditoria_sistema FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.sesiones_tokens FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_all" ON public.auditoria_sesiones FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_all" ON public.usuarios FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.roles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.permisos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.roles_permisos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.modulos_sistema FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.equipos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.historial_movimientos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.mantenimientos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.auditoria_sistema FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.sesiones_tokens FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_all" ON public.auditoria_sesiones FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_all" ON public.usuarios FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.roles FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.permisos FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.roles_permisos FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.modulos_sistema FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.equipos FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.historial_movimientos FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.mantenimientos FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.auditoria_sistema FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.sesiones_tokens FOR DELETE TO anon USING (true);
CREATE POLICY "anon_delete_all" ON public.auditoria_sesiones FOR DELETE TO anon USING (true);