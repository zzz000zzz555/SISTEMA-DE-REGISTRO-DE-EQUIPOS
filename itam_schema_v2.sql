-- ============================================================================
-- SISTEMA EMPRESARIAL ITAM - SEGURIDAD, USUARIOS, RBAC, ACTIVOS Y AUDITORÍA FORENSE
-- PostgreSQL / Supabase - Esquema completo nivel corporativo/estatal (ISO 27001)
-- Orden: DROP -> Tablas -> Índices -> Funciones/Triggers -> Vistas -> Seed Data
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- LIMPIEZA (DROP) DE OBJETOS PREVIOS
-- ============================================================================
DROP VIEW IF EXISTS public.vista_inventario_completo CASCADE;
DROP VIEW IF EXISTS public.vista_permisos_usuario CASCADE;

DROP TABLE IF EXISTS public.auditoria_sistema CASCADE;
DROP TABLE IF EXISTS public.mantenimientos CASCADE;
DROP TABLE IF EXISTS public.historial_movimientos CASCADE;
DROP TABLE IF EXISTS public.equipos CASCADE;
DROP TABLE IF EXISTS public.ubicaciones CASCADE;
DROP TABLE IF EXISTS public.estados_operativos CASCADE;
DROP TABLE IF EXISTS public.tipos_equipo CASCADE;
DROP TABLE IF EXISTS public.colores CASCADE;
DROP TABLE IF EXISTS public.modelos CASCADE;
DROP TABLE IF EXISTS public.marcas CASCADE;
DROP TABLE IF EXISTS public.categorias CASCADE;
DROP TABLE IF EXISTS public.sesiones_tokens CASCADE;
DROP TABLE IF EXISTS public.roles_permisos CASCADE;
DROP TABLE IF EXISTS public.permisos CASCADE;
DROP TABLE IF EXISTS public.modulos_sistema CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

DROP FUNCTION IF EXISTS public.fn_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.fn_auditoria_forense() CASCADE;
DROP FUNCTION IF EXISTS public.fn_registrar_movimiento_equipo() CASCADE;
DROP FUNCTION IF EXISTS public.fn_baja_automatica() CASCADE;

-- ============================================================================
-- BLOQUE 1: SEGURIDAD, USUARIOS, ROLES, MÓDULOS, TOKENS (RBAC)
-- ============================================================================

-- 1. roles
CREATE TABLE public.roles (
    id_rol            SERIAL PRIMARY KEY,
    nombre_rol        VARCHAR(80) UNIQUE NOT NULL,
    descripcion       TEXT,
    nivel_jerarquia   INTEGER NOT NULL DEFAULT 10,
    es_sistema        BOOLEAN DEFAULT false,
    activo            BOOLEAN DEFAULT true,
    fecha_registro    TIMESTAMPTZ DEFAULT now(),
    fecha_finalizacion TIMESTAMPTZ
);

-- 2. modulos_sistema
CREATE TABLE public.modulos_sistema (
    id_modulo        SERIAL PRIMARY KEY,
    id_modulo_padre  INTEGER REFERENCES public.modulos_sistema(id_modulo) ON DELETE SET NULL,
    codigo_modulo    VARCHAR(50) UNIQUE NOT NULL,
    nombre_modulo    VARCHAR(100) NOT NULL,
    descripcion      TEXT,
    ruta_endpoint    VARCHAR(150),
    icono            VARCHAR(50),
    orden_visual     INTEGER DEFAULT 1,
    activo           BOOLEAN DEFAULT true,
    fecha_registro   TIMESTAMPTZ DEFAULT now(),
    fecha_finalizacion TIMESTAMPTZ
);

-- 3. permisos
CREATE TABLE public.permisos (
    id_permiso     SERIAL PRIMARY KEY,
    id_modulo      INTEGER NOT NULL REFERENCES public.modulos_sistema(id_modulo) ON DELETE CASCADE,
    codigo_permiso  VARCHAR(80) UNIQUE NOT NULL,
    nombre_permiso  VARCHAR(120) NOT NULL,
    accion         VARCHAR(30) NOT NULL CHECK (accion IN ('VER','CREAR','EDITAR','ELIMINAR','ANULAR','EXPORTAR','APROBAR')),
    descripcion    TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT now(),
    fecha_finalizacion TIMESTAMPTZ
);

-- 4. usuarios
CREATE TABLE public.usuarios (
    id_usuario            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_rol                INTEGER NOT NULL REFERENCES public.roles(id_rol) ON DELETE RESTRICT,
    tipo_documento        VARCHAR(20) NOT NULL DEFAULT 'DNI' CHECK (tipo_documento IN ('DNI','CE','PASAPORTE','RUC')),
    numero_documento      VARCHAR(20) UNIQUE NOT NULL,
    codigo_empleado       VARCHAR(30) UNIQUE,
    nombres               VARCHAR(100) NOT NULL,
    apellidos             VARCHAR(100) NOT NULL,
    correo_corporativo     VARCHAR(150) UNIQUE NOT NULL,
    telefono              VARCHAR(20),
    username              VARCHAR(50) UNIQUE NOT NULL,
    password_hash         TEXT NOT NULL,
    requiere_cambio_clave BOOLEAN DEFAULT true,
    intentos_fallidos     INTEGER DEFAULT 0,
    bloqueado_hasta       TIMESTAMPTZ,
    estado_cuenta         VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado_cuenta IN ('ACTIVO','SUSPENDIDO','CESADO','BLOQUEADO')),
    ultimo_acceso         TIMESTAMPTZ,
    fecha_registro        TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_finalizacion    TIMESTAMPTZ,
    creado_por            UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    updated_at            TIMESTAMPTZ DEFAULT now()
);

-- 5. roles_permisos
CREATE TABLE public.roles_permisos (
    id_rol_permiso    SERIAL PRIMARY KEY,
    id_rol            INTEGER NOT NULL REFERENCES public.roles(id_rol) ON DELETE CASCADE,
    id_permiso        INTEGER NOT NULL REFERENCES public.permisos(id_permiso) ON DELETE CASCADE,
    asignado_por      UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    activo            BOOLEAN DEFAULT true,
    fecha_registro    TIMESTAMPTZ DEFAULT now(),
    fecha_finalizacion TIMESTAMPTZ,
    UNIQUE (id_rol, id_permiso)
);

-- 6. sesiones_tokens
CREATE TABLE public.sesiones_tokens (
    id_sesion         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario        UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    token_hash        TEXT UNIQUE NOT NULL,
    refresh_token_hash TEXT UNIQUE,
    ip_origen         VARCHAR(45) NOT NULL,
    agente_navegador  TEXT,
    dispositivo       VARCHAR(100),
    estado_sesion     VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado_sesion IN ('ACTIVA','CERRADA','EXPIRADA','REVOCADA_ADMIN')),
    fecha_registro    TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_expiracion  TIMESTAMPTZ NOT NULL,
    fecha_finalizacion TIMESTAMPTZ,
    motivo_cierre     VARCHAR(100)
);

-- ============================================================================
-- BLOQUE 2: CATÁLOGOS MAESTROS Y ACTIVOS PATRIMONIALES
-- ============================================================================

-- 7. categorias
CREATE TABLE public.categorias (
    id_categoria               SERIAL PRIMARY KEY,
    nombre                     VARCHAR(100) UNIQUE NOT NULL,
    prefijo_codigo             VARCHAR(10) UNIQUE NOT NULL,
    esquema_atributos_sugerido JSONB DEFAULT '{}'::jsonb,
    vida_util_anios            INTEGER DEFAULT 4,
    activo                     BOOLEAN DEFAULT true,
    fecha_registro             TIMESTAMPTZ DEFAULT now(),
    fecha_finalizacion         TIMESTAMPTZ
);

-- 8. marcas
CREATE TABLE public.marcas (
    id_marca           SERIAL PRIMARY KEY,
    nombre             VARCHAR(100) UNIQUE NOT NULL,
    activo             BOOLEAN DEFAULT true,
    fecha_registro     TIMESTAMPTZ DEFAULT now(),
    fecha_finalizacion TIMESTAMPTZ
);

-- 9. modelos
CREATE TABLE public.modelos (
    id_modelo          SERIAL PRIMARY KEY,
    id_marca           INTEGER NOT NULL REFERENCES public.marcas(id_marca) ON DELETE RESTRICT,
    id_categoria       INTEGER NOT NULL REFERENCES public.categorias(id_categoria) ON DELETE RESTRICT,
    nombre             VARCHAR(150) NOT NULL,
    activo             BOOLEAN DEFAULT true,
    fecha_registro     TIMESTAMPTZ DEFAULT now(),
    fecha_finalizacion TIMESTAMPTZ,
    UNIQUE (id_marca, id_categoria, nombre)
);

-- 10. colores
CREATE TABLE public.colores (
    id_color       SERIAL PRIMARY KEY,
    nombre         VARCHAR(50) UNIQUE NOT NULL,
    codigo_hex     VARCHAR(7) NOT NULL,
    fecha_registro TIMESTAMPTZ DEFAULT now()
);

-- 11. tipos_equipo
CREATE TABLE public.tipos_equipo (
    id_tipo_equipo     SERIAL PRIMARY KEY,
    id_categoria       INTEGER NOT NULL REFERENCES public.categorias(id_categoria) ON DELETE CASCADE,
    nombre             VARCHAR(100) NOT NULL,
    activo             BOOLEAN DEFAULT true,
    fecha_registro     TIMESTAMPTZ DEFAULT now(),
    fecha_finalizacion TIMESTAMPTZ,
    UNIQUE (id_categoria, nombre)
);

-- 12. estados_operativos
CREATE TABLE public.estados_operativos (
    id_estado          SERIAL PRIMARY KEY,
    nombre             VARCHAR(50) UNIQUE NOT NULL,
    permite_asignacion BOOLEAN DEFAULT true,
    color_badge        VARCHAR(20) NOT NULL,
    fecha_registro     TIMESTAMPTZ DEFAULT now()
);

-- 13. ubicaciones
CREATE TABLE public.ubicaciones (
    id_ubicacion           SERIAL PRIMARY KEY,
    sede                   VARCHAR(100) NOT NULL,
    area_departamento      VARCHAR(100) NOT NULL,
    piso_oficina           VARCHAR(50),
    id_usuario_responsable UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    activo                 BOOLEAN DEFAULT true,
    fecha_registro         TIMESTAMPTZ DEFAULT now(),
    fecha_finalizacion     TIMESTAMPTZ
);

-- 14. equipos
CREATE TABLE public.equipos (
    id_equipo                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_patrimonial        VARCHAR(50) UNIQUE NOT NULL,
    codigo_barras             VARCHAR(100) UNIQUE NOT NULL,
    numero_serie              VARCHAR(100) UNIQUE,
    id_categoria              INTEGER NOT NULL REFERENCES public.categorias(id_categoria),
    id_tipo_equipo            INTEGER REFERENCES public.tipos_equipo(id_tipo_equipo),
    id_marca                  INTEGER NOT NULL REFERENCES public.marcas(id_marca),
    id_modelo                 INTEGER REFERENCES public.modelos(id_modelo),
    id_color                  INTEGER REFERENCES public.colores(id_color),
    id_estado                 INTEGER NOT NULL REFERENCES public.estados_operativos(id_estado),
    id_ubicacion_actual       INTEGER NOT NULL REFERENCES public.ubicaciones(id_ubicacion),
    id_usuario_asignado       UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    id_equipo_padre           UUID REFERENCES public.equipos(id_equipo) ON DELETE SET NULL,
    tipo_conexion             VARCHAR(100),
    direccion_mac             VARCHAR(20),
    direccion_ip              VARCHAR(45),
    especificaciones_tecnicas JSONB DEFAULT '{}'::jsonb,
    documento_compra_factura   VARCHAR(100),
    proveedor                 VARCHAR(150),
    valor_compra              NUMERIC(12,2),
    fecha_adquisicion         DATE,
    garantia_hasta            DATE,
    fecha_registro            TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_finalizacion        TIMESTAMPTZ,
    motivo_finalizacion       TEXT,
    registrado_por            UUID NOT NULL REFERENCES public.usuarios(id_usuario),
    modificado_por            UUID REFERENCES public.usuarios(id_usuario),
    observaciones             TEXT,
    updated_at                TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- BLOQUE 3: TRAZABILIDAD, MANTENIMIENTO Y AUDITORÍA FORENSE
-- ============================================================================

-- 15. historial_movimientos
CREATE TABLE public.historial_movimientos (
    id_movimiento        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_equipo            UUID NOT NULL REFERENCES public.equipos(id_equipo) ON DELETE RESTRICT,
    tipo_accion          VARCHAR(50) NOT NULL CHECK (tipo_accion IN ('ALTA_INICIAL','TRASLADO_AREA','ASIGNACION_USUARIO','CAMBIO_ESTADO','VINCULACION_PADRE','BAJA_PATRIMONIAL')),
    id_ubicacion_origen  INTEGER REFERENCES public.ubicaciones(id_ubicacion),
    id_ubicacion_destino INTEGER NOT NULL REFERENCES public.ubicaciones(id_ubicacion),
    id_usuario_anterior  UUID REFERENCES public.usuarios(id_usuario),
    id_usuario_nuevo     UUID REFERENCES public.usuarios(id_usuario),
    id_estado_anterior   INTEGER REFERENCES public.estados_operativos(id_estado),
    id_estado_nuevo      INTEGER NOT NULL REFERENCES public.estados_operativos(id_estado),
    id_usuario_autoriza  UUID NOT NULL REFERENCES public.usuarios(id_usuario),
    motivo               TEXT NOT NULL,
    fecha_registro       TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_finalizacion   TIMESTAMPTZ
);

-- 16. mantenimientos
CREATE TABLE public.mantenimientos (
    id_mantenimiento      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_equipo             UUID NOT NULL REFERENCES public.equipos(id_equipo) ON DELETE RESTRICT,
    tipo_mantenimiento    VARCHAR(30) NOT NULL CHECK (tipo_mantenimiento IN ('PREVENTIVO','CORRECTIVO','GARANTIA_EXTERNA','REPOTENCIACION')),
    descripcion_falla     TEXT NOT NULL,
    trabajo_realizado      TEXT,
    repuestos_usados      JSONB DEFAULT '[]'::jsonb,
    costo                 NUMERIC(10,2) DEFAULT 0.00,
    id_tecnico_responsable UUID NOT NULL REFERENCES public.usuarios(id_usuario),
    fecha_registro        TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_finalizacion    TIMESTAMPTZ,
    estado_servicio       VARCHAR(30) DEFAULT 'EN_PROCESO' CHECK (estado_servicio IN ('EN_PROCESO','FINALIZADO','IRREPARABLE'))
);

-- 17. auditoria_sistema
CREATE TABLE public.auditoria_sistema (
    id_auditoria          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabla_afectada        VARCHAR(100) NOT NULL,
    operacion             VARCHAR(20) NOT NULL CHECK (operacion IN ('INSERT','UPDATE','DELETE','LOGIN_OK','LOGIN_FAIL','TOKEN_REVOCADO')),
    id_registro_afectado  VARCHAR(100) NOT NULL,
    id_usuario_ejecutor   UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    id_sesion             UUID REFERENCES public.sesiones_tokens(id_sesion) ON DELETE SET NULL,
    ip_origen             VARCHAR(45),
    datos_anteriores      JSONB,
    datos_nuevos          JSONB,
    fecha_registro        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_equipos_codigo_patrimonial ON public.equipos(codigo_patrimonial);
CREATE INDEX IF NOT EXISTS idx_equipos_codigo_barras     ON public.equipos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_equipos_numero_serie      ON public.equipos(numero_serie);
CREATE INDEX IF NOT EXISTS idx_equipos_categoria         ON public.equipos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo_equipo       ON public.equipos(id_tipo_equipo);
CREATE INDEX IF NOT EXISTS idx_equipos_marca             ON public.equipos(id_marca);
CREATE INDEX IF NOT EXISTS idx_equipos_modelo            ON public.equipos(id_modelo);
CREATE INDEX IF NOT EXISTS idx_equipos_color             ON public.equipos(id_color);
CREATE INDEX IF NOT EXISTS idx_equipos_estado            ON public.equipos(id_estado);
CREATE INDEX IF NOT EXISTS idx_equipos_ubicacion         ON public.equipos(id_ubicacion_actual);
CREATE INDEX IF NOT EXISTS idx_equipos_usuario_asignado  ON public.equipos(id_usuario_asignado);
CREATE INDEX IF NOT EXISTS idx_equipos_padre             ON public.equipos(id_equipo_padre);
CREATE INDEX IF NOT EXISTS idx_equipos_specs_gin        ON public.equipos USING GIN (especificaciones_tecnicas);
CREATE INDEX IF NOT EXISTS idx_equipos_mac              ON public.equipos(direccion_mac);

CREATE INDEX IF NOT EXISTS idx_hist_equipo              ON public.historial_movimientos(id_equipo);
CREATE INDEX IF NOT EXISTS idx_hist_fecha               ON public.historial_movimientos(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_mant_equipo              ON public.mantenimientos(id_equipo);
CREATE INDEX IF NOT EXISTS idx_aud_tabla               ON public.auditoria_sistema(tabla_afectada);
CREATE INDEX IF NOT EXISTS idx_aud_fecha               ON public.auditoria_sistema(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_aud_usuario             ON public.auditoria_sistema(id_usuario_ejecutor);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario        ON public.sesiones_tokens(id_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol            ON public.usuarios(id_rol);
CREATE INDEX IF NOT EXISTS idx_permisos_modulo         ON public.permisos(id_modulo);
CREATE INDEX IF NOT EXISTS idx_rp_rol                  ON public.roles_permisos(id_rol);
CREATE INDEX IF NOT EXISTS idx_rp_permiso              ON public.roles_permisos(id_permiso);
CREATE INDEX IF NOT EXISTS idx_modelos_marca           ON public.modelos(id_marca);
CREATE INDEX IF NOT EXISTS idx_modelos_categoria       ON public.modelos(id_categoria);
CREATE INDEX IF NOT EXISTS idx_tipos_categoria         ON public.tipos_equipo(id_categoria);
CREATE INDEX IF NOT EXISTS idx_ubicaciones_resp        ON public.ubicaciones(id_usuario_responsable);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auditoría forense universal
CREATE OR REPLACE FUNCTION public.fn_auditoria_forense()
RETURNS TRIGGER AS $$
DECLARE
    v_pk_col TEXT;
    v_pk_val TEXT;
    v_old    JSONB;
    v_new    JSONB;
    v_user   UUID;
    v_sesion UUID;
    v_ip     VARCHAR(45);
BEGIN
    CASE TG_TABLE_NAME
        WHEN 'equipos'          THEN v_pk_col := 'id_equipo';
        WHEN 'usuarios'         THEN v_pk_col := 'id_usuario';
        WHEN 'roles_permisos'   THEN v_pk_col := 'id_rol_permiso';
        WHEN 'mantenimientos'   THEN v_pk_col := 'id_mantenimiento';
        ELSE v_pk_col := 'id';
    END CASE;

    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD); v_new := NULL;
        v_pk_val := v_old ->> v_pk_col;
    ELSIF TG_OP = 'INSERT' THEN
        v_old := NULL; v_new := to_jsonb(NEW);
        v_pk_val := v_new ->> v_pk_col;
    ELSE
        v_old := to_jsonb(OLD); v_new := to_jsonb(NEW);
        v_pk_val := v_new ->> v_pk_col;
    END IF;

    BEGIN
        v_user := NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN v_user := NULL;
    END;
    BEGIN
        v_sesion := NULLIF(current_setting('app.session_id', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN v_sesion := NULL;
    END;
    v_ip := NULLIF(current_setting('app.ip_origen', true), '');

    INSERT INTO public.auditoria_sistema (
        tabla_afectada, operacion, id_registro_afectado,
        id_usuario_ejecutor, id_sesion, ip_origen,
        datos_anteriores, datos_nuevos, fecha_registro
    ) VALUES (
        TG_TABLE_NAME, TG_OP, COALESCE(v_pk_val, ''),
        v_user, v_sesion, v_ip,
        v_old, v_new, now()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Historial patrimonial automático
CREATE OR REPLACE FUNCTION public.fn_registrar_movimiento_equipo()
RETURNS TRIGGER AS $$
DECLARE
    v_user  UUID;
    v_tipo  VARCHAR(50);
    v_motivo TEXT;
BEGIN
    IF (OLD.id_ubicacion_actual IS DISTINCT FROM NEW.id_ubicacion_actual)
       OR (OLD.id_estado IS DISTINCT FROM NEW.id_estado)
       OR (OLD.id_usuario_asignado IS DISTINCT FROM NEW.id_usuario_asignado) THEN

        v_tipo := CASE
            WHEN OLD.id_estado IS DISTINCT FROM NEW.id_estado THEN 'CAMBIO_ESTADO'
            WHEN OLD.id_ubicacion_actual IS DISTINCT FROM NEW.id_ubicacion_actual THEN 'TRASLADO_AREA'
            ELSE 'ASIGNACION_USUARIO'
        END;

        v_motivo := COALESCE(NULLIF(current_setting('app.motivo_movimiento', true), ''), 'Actualización automática de activo');

        BEGIN
            v_user := NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
        EXCEPTION WHEN OTHERS THEN v_user := NULL;
        END;
        IF v_user IS NULL THEN
            v_user := COALESCE(NEW.modificado_por, NEW.registrado_por);
        END IF;

        INSERT INTO public.historial_movimientos (
            id_equipo, tipo_accion,
            id_ubicacion_origen, id_ubicacion_destino,
            id_usuario_anterior, id_usuario_nuevo,
            id_estado_anterior, id_estado_nuevo,
            id_usuario_autoriza, motivo, fecha_registro
        ) VALUES (
            NEW.id_equipo, v_tipo,
            OLD.id_ubicacion_actual, NEW.id_ubicacion_actual,
            OLD.id_usuario_asignado, NEW.id_usuario_asignado,
            OLD.id_estado, NEW.id_estado,
            v_user, v_motivo, now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Baja automática
CREATE OR REPLACE FUNCTION public.fn_baja_automatica()
RETURNS TRIGGER AS $$
DECLARE
    v_id_baja INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'equipos' THEN
        SELECT id_estado INTO v_id_baja FROM public.estados_operativos WHERE nombre = 'De Baja' LIMIT 1;
        IF NEW.id_estado = v_id_baja AND NEW.fecha_finalizacion IS NULL THEN
            NEW.fecha_finalizacion := now();
        END IF;
    ELSIF TG_TABLE_NAME = 'usuarios' THEN
        IF NEW.estado_cuenta = 'CESADO' AND NEW.fecha_finalizacion IS NULL THEN
            NEW.fecha_finalizacion := now();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- updated_at
CREATE TRIGGER trg_equipos_updated_at
    BEFORE UPDATE ON public.equipos
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- baja automática
CREATE TRIGGER trg_equipos_baja
    BEFORE UPDATE ON public.equipos
    FOR EACH ROW EXECUTE FUNCTION public.fn_baja_automatica();

CREATE TRIGGER trg_usuarios_baja
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.fn_baja_automatica();

-- historial patrimonial
CREATE TRIGGER trg_equipos_movimiento
    AFTER UPDATE ON public.equipos
    FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_movimiento_equipo();

-- auditoría forense
CREATE TRIGGER trg_audit_equipos
    AFTER INSERT OR UPDATE OR DELETE ON public.equipos
    FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_forense();

CREATE TRIGGER trg_audit_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_forense();

CREATE TRIGGER trg_audit_roles_permisos
    AFTER INSERT OR UPDATE OR DELETE ON public.roles_permisos
    FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_forense();

CREATE TRIGGER trg_audit_mantenimientos
    AFTER INSERT OR UPDATE OR DELETE ON public.mantenimientos
    FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_forense();

-- ============================================================================
-- VISTAS
-- ============================================================================

CREATE OR REPLACE VIEW public.vista_inventario_completo AS
SELECT
    e.id_equipo,
    e.codigo_patrimonial,
    e.codigo_barras,
    e.numero_serie,
    c.id_categoria,
    c.nombre                AS categoria,
    c.prefijo_codigo        AS categoria_prefijo,
    te.id_tipo_equipo,
    te.nombre               AS tipo_equipo,
    m.id_marca,
    m.nombre                AS marca,
    mo.id_modelo,
    mo.nombre               AS modelo,
    col.id_color,
    col.nombre              AS color,
    col.codigo_hex          AS color_hex,
    es.id_estado,
    es.nombre               AS estado,
    es.permite_asignacion   AS estado_permite_asignacion,
    es.color_badge          AS estado_color_badge,
    u.id_ubicacion,
    u.sede,
    u.area_departamento,
    u.piso_oficina,
    ua.id_usuario           AS id_usuario_asignado,
    ua.nombres || ' ' || ua.apellidos AS usuario_asignado,
    ur.id_usuario           AS id_usuario_registrador,
    ur.nombres || ' ' || ur.apellidos AS registrado_por_nombre,
    e.id_equipo_padre,
    ep.codigo_patrimonial   AS equipo_padre_codigo_patrimonial,
    e.tipo_conexion,
    e.direccion_mac,
    e.direccion_ip,
    e.especificaciones_tecnicas,
    e.documento_compra_factura,
    e.proveedor,
    e.valor_compra,
    e.fecha_adquisicion,
    e.garantia_hasta,
    e.fecha_registro,
    e.fecha_finalizacion,
    e.motivo_finalizacion,
    e.observaciones,
    e.updated_at
FROM public.equipos e
LEFT JOIN public.categorias        c   ON c.id_categoria = e.id_categoria
LEFT JOIN public.tipos_equipo     te  ON te.id_tipo_equipo = e.id_tipo_equipo
LEFT JOIN public.marcas           m   ON m.id_marca = e.id_marca
LEFT JOIN public.modelos          mo  ON mo.id_modelo = e.id_modelo
LEFT JOIN public.colores          col ON col.id_color = e.id_color
LEFT JOIN public.estados_operativos es ON es.id_estado = e.id_estado
LEFT JOIN public.ubicaciones      u   ON u.id_ubicacion = e.id_ubicacion_actual
LEFT JOIN public.usuarios         ua  ON ua.id_usuario = e.id_usuario_asignado
LEFT JOIN public.usuarios         ur  ON ur.id_usuario = e.registrado_por
LEFT JOIN public.equipos          ep  ON ep.id_equipo = e.id_equipo_padre;

CREATE OR REPLACE VIEW public.vista_permisos_usuario AS
SELECT
    u.id_usuario,
    u.username,
    u.correo_corporativo,
    u.estado_cuenta,
    r.id_rol,
    r.nombre_rol,
    r.nivel_jerarquia,
    p.id_permiso,
    p.codigo_permiso,
    p.nombre_permiso,
    p.accion,
    m.id_modulo,
    m.codigo_modulo,
    m.nombre_modulo,
    m.ruta_endpoint,
    rp.fecha_registro      AS permiso_asignado_en,
    rp.fecha_finalizacion  AS permiso_vigente_hasta
FROM public.usuarios u
JOIN public.roles r ON r.id_rol = u.id_rol
JOIN public.roles_permisos rp ON rp.id_rol = r.id_rol
    AND rp.activo = true
    AND (rp.fecha_finalizacion IS NULL OR rp.fecha_finalizacion > now())
JOIN public.permisos p ON p.id_permiso = rp.id_permiso
JOIN public.modulos_sistema m ON m.id_modulo = p.id_modulo
    AND m.activo = true
    AND (m.fecha_finalizacion IS NULL OR m.fecha_finalizacion > now())
WHERE u.estado_cuenta = 'ACTIVO'
    AND (u.fecha_finalizacion IS NULL OR u.fecha_finalizacion > now())
    AND r.activo = true
    AND (r.fecha_finalizacion IS NULL OR r.fecha_finalizacion > now());

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Roles
INSERT INTO public.roles (nombre_rol, descripcion, nivel_jerarquia, es_sistema) VALUES
    ('Super Administrador','Control total del sistema y auditoría',1,true),
    ('Jefe de Patrimonio TI','Gestión y control patrimonial de activos TI',2,false),
    ('Soporte Técnico','Mantenimiento y soporte de equipos',5,false),
    ('Auditor de Sistemas','Auditoría y consulta de solo lectura',3,false)
ON CONFLICT (nombre_rol) DO NOTHING;

-- Módulos
INSERT INTO public.modulos_sistema (codigo_modulo, nombre_modulo, descripcion, ruta_endpoint, icono, orden_visual) VALUES
    ('MOD_DASHBOARD','Dashboard','Panel principal','/dashboard','dashboard',1),
    ('MOD_EQUIPOS','Gestión de Equipos','Inventario patrimonial de equipos','/inventario/equipos','computer',2),
    ('MOD_MANTENIMIENTO','Mantenimientos','Control técnico preventivo/correctivo','/mantenimientos','build',3),
    ('MOD_USUARIOS','Usuarios y Seguridad','Gestión de usuarios, roles y permisos','/seguridad/usuarios','people',4),
    ('MOD_AUDITORIA','Auditoría Forense','Bitácora inmutable del sistema','/auditoria','security',5)
ON CONFLICT (codigo_modulo) DO NOTHING;

-- Permisos (módulo Equipos)
INSERT INTO public.permisos (id_modulo, codigo_permiso, nombre_permiso, accion, descripcion)
SELECT m.id_modulo, p.codigo, p.nombre, p.accion, p.descr
FROM public.modulos_sistema m
CROSS JOIN (VALUES
    ('EQUIPOS_VER','Ver Equipos','VER','Consultar inventario de equipos'),
    ('EQUIPOS_CREAR','Crear Equipos','CREAR','Registrar nuevos activos'),
    ('EQUIPOS_EDITAR','Editar Equipos','EDITAR','Modificar datos de activos'),
    ('EQUIPOS_DAR_BAJA','Dar de Baja','ANULAR','Baja patrimonial de activos'),
    ('EQUIPOS_EXPORTAR','Exportar Equipos','EXPORTAR','Exportar inventario')
) AS p(codigo,nombre,accion,descr)
WHERE m.codigo_modulo='MOD_EQUIPOS'
ON CONFLICT (codigo_permiso) DO NOTHING;

-- Usuarios
INSERT INTO public.usuarios (id_rol, tipo_documento, numero_documento, codigo_empleado, nombres, apellidos, correo_corporativo, telefono, username, password_hash, requiere_cambio_clave, estado_cuenta, fecha_registro)
SELECT r.id_rol,'DNI','12345678','EMP-001','Carlos','Administrador','admin@empresa.com','999111222','admin','$2a$10$7EqJtq98hPqEX7fNZaFWoOe5r5r5r5r5r5r5r5r5r5r5r5r5r5r5',true,'ACTIVO',now()
FROM public.roles r WHERE r.nombre_rol='Super Administrador';

INSERT INTO public.usuarios (id_rol, tipo_documento, numero_documento, codigo_empleado, nombres, apellidos, correo_corporativo, telefono, username, password_hash, requiere_cambio_clave, estado_cuenta, fecha_registro, creado_por)
SELECT r.id_rol,'DNI','87654321','EMP-002','Luis','Técnico','tecnico@empresa.com','999333444','tecnico','$2a$10$7EqJtq98hPqEX7fNZaFWoOe5r5r5r5r5r5r5r5r5r5r5r5r5r5r5',true,'ACTIVO',now(),u.id_usuario
FROM public.roles r, public.usuarios u
WHERE r.nombre_rol='Soporte Técnico' AND u.username='admin';

-- Roles-Permisos (Super Admin)
INSERT INTO public.roles_permisos (id_rol, id_permiso, asignado_por, activo)
SELECT r.id_rol, p.id_permiso, u.id_usuario, true
FROM public.roles r
JOIN public.permisos p ON true
JOIN public.usuarios u ON u.username='admin'
WHERE r.nombre_rol='Super Administrador'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

-- Sesión token activa
INSERT INTO public.sesiones_tokens (id_usuario, token_hash, refresh_token_hash, ip_origen, agente_navegador, dispositivo, estado_sesion, fecha_registro, fecha_expiracion)
SELECT u.id_usuario,'hash_token_activo_abc123','hash_refresh_xyz789','192.168.1.50','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0','PC Desktop Windows','ACTIVA',now(),now() + INTERVAL '8 hours'
FROM public.usuarios u WHERE u.username='admin';

-- Catálogos
INSERT INTO public.categorias (nombre, prefijo_codigo, esquema_atributos_sugerido, vida_util_anios) VALUES
    ('Pantalla/Monitor','MON','{"pulgadas":null,"panel":"","resolucion":"","tasa_refresco_hz":null}'::jsonb,5),
    ('Teclado','TEC','{"tipo_switch":"","retroiluminacion":false,"inalambrico":false}'::jsonb,4),
    ('Mouse','MOU','{"dpi":null,"botones":null,"inalambrico":false}'::jsonb,4),
    ('PC/Workstation','CPU','{"ram_gb":null,"procesador":"","almacenamiento":"","gpu":""}'::jsonb,5),
    ('Impresora','IMP','{"tipo_impresion":"","velocidad_ppm":null,"multifuncional":false}'::jsonb,5),
    ('Parlantes','PAR','{"potencia_w":null,"conectividad":"","subwoofer":false}'::jsonb,4),
    ('Audífonos','AUD','{"tipo":"","microfono":false,"inalambrico":false,"conector":""}'::jsonb,4)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.marcas (nombre) VALUES
    ('HP'),('Dell'),('LG'),('Logitech'),('Epson'),('Teros'),('Micronics'),('Sony')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.colores (nombre, codigo_hex) VALUES
    ('Negro','#000000'),('Blanco','#FFFFFF'),('Plata','#C0C0C0'),('Gris Oscuro','#333333')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.estados_operativos (nombre, permite_asignacion, color_badge) VALUES
    ('Nuevo',true,'verde'),('Operativo',true,'azul'),('En Mantenimiento',false,'amarillo'),('De Baja',false,'rojo')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.tipos_equipo (id_categoria, nombre)
SELECT c.id_categoria, t.nombre FROM public.categorias c
CROSS JOIN (VALUES
    ('Pantalla/Monitor','LED'),('Pantalla/Monitor','Curvo'),('Pantalla/Monitor','IPS'),
    ('Teclado','Mecánico'),('Teclado','Membrana'),('Teclado','Inalámbrico'),
    ('Impresora','Láser'),('Impresora','Multifuncional Tinta'),('Impresora','Matricial'),
    ('Audífonos','Over-Ear USB'),('Audífonos','In-Ear Bluetooth')
) AS t(cat,nombre)
WHERE c.nombre=t.cat
ON CONFLICT (id_categoria, nombre) DO NOTHING;

INSERT INTO public.ubicaciones (sede, area_departamento, piso_oficina) VALUES
    ('Sede Central','Soporte TI','Piso 2'),
    ('Sede Central','Administración','Piso 1'),
    ('Sede Central','Contabilidad','Piso 1'),
    ('Sede Central','Almacén Central','Piso 0');

-- responsable de área Soporte TI = admin
UPDATE public.ubicaciones SET id_usuario_responsable = (SELECT id_usuario FROM public.usuarios WHERE username='admin')
WHERE area_departamento='Soporte TI';

INSERT INTO public.modelos (id_marca, id_categoria, nombre)
SELECT m.id_marca, c.id_categoria, md.nombre
FROM (VALUES
    ('HP','PC/Workstation','ProDesk 400 G7'),
    ('LG','Pantalla/Monitor','24MK430H'),
    ('Logitech','Teclado','K120'),
    ('Micronics','Parlantes','SP-100'),
    ('Sony','Audífonos','WH-CH520'),
    ('Epson','Impresora','EcoTank L3250')
) AS md(marca,categoria,nombre)
JOIN public.marcas m ON m.nombre=md.marca
JOIN public.categorias c ON c.nombre=md.categoria
ON CONFLICT (id_marca, id_categoria, nombre) DO NOTHING;

-- Equipos (PC Principal)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    id_categoria, id_tipo_equipo, id_marca, id_modelo, id_color, id_estado, id_ubicacion_actual,
    id_equipo_padre, tipo_conexion, especificaciones_tecnicas,
    documento_compra_factura, proveedor, valor_compra, fecha_adquisicion, garantia_hasta,
    registrado_por, observaciones
)
SELECT
    'CPU-001','BC-CPU-001','SN-PC-001',
    c.id_categoria, NULL, m.id_marca, mo.id_modelo, col.id_color, es.id_estado, u.id_ubicacion,
    NULL,'RJ45 / Wi-Fi',
    '{"ram_gb":16,"procesador":"Intel Core i7-10700","almacenamiento":"512GB NVMe","gpu":"Intel UHD Graphics"}'::jsonb,
    'OC-2024-001','Proveedor TI SAC',3500.00,CURRENT_DATE,(CURRENT_DATE + INTERVAL '2 years')::date,
    usr.id_usuario,'Estación de trabajo principal - Soporte TI'
FROM public.categorias c
JOIN public.marcas m ON m.nombre='HP'
JOIN public.modelos mo ON mo.nombre='ProDesk 400 G7'
JOIN public.colores col ON col.nombre='Negro'
JOIN public.estados_operativos es ON es.nombre='Nuevo'
JOIN public.ubicaciones u ON u.area_departamento='Soporte TI'
JOIN public.usuarios usr ON usr.username='admin'
WHERE c.nombre='PC/Workstation';

-- Pantalla (hijo)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    id_categoria, id_tipo_equipo, id_marca, id_modelo, id_color, id_estado, id_ubicacion_actual,
    id_equipo_padre, tipo_conexion, especificaciones_tecnicas,
    documento_compra_factura, proveedor, valor_compra, fecha_adquisicion, garantia_hasta,
    registrado_por, observaciones
)
SELECT
    'MON-001','BC-MON-001','SN-MON-001',
    c.id_categoria, te.id_tipo_equipo, m.id_marca, mo.id_modelo, col.id_color, es.id_estado, u.id_ubicacion,
    (SELECT id_equipo FROM public.equipos WHERE codigo_patrimonial='CPU-001'),
    'HDMI + DisplayPort',
    '{"pulgadas":24,"panel":"IPS","resolucion":"1920x1080","tasa_refresco_hz":75}'::jsonb,
    'OC-2024-002','Proveedor TI SAC',650.00,CURRENT_DATE,(CURRENT_DATE + INTERVAL '2 years')::date,
    usr.id_usuario,'Monitor vinculado a estación CPU-001'
FROM public.categorias c
JOIN public.tipos_equipo te ON te.id_categoria=c.id_categoria AND te.nombre='IPS'
JOIN public.marcas m ON m.nombre='LG'
JOIN public.modelos mo ON mo.nombre='24MK430H'
JOIN public.colores col ON col.nombre='Negro'
JOIN public.estados_operativos es ON es.nombre='Nuevo'
JOIN public.ubicaciones u ON u.area_departamento='Soporte TI'
JOIN public.usuarios usr ON usr.username='admin'
WHERE c.nombre='Pantalla/Monitor';

-- Teclado (hijo)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    id_categoria, id_tipo_equipo, id_marca, id_modelo, id_color, id_estado, id_ubicacion_actual,
    id_equipo_padre, tipo_conexion, especificaciones_tecnicas,
    documento_compra_factura, proveedor, valor_compra, fecha_adquisicion, garantia_hasta,
    registrado_por, observaciones
)
SELECT
    'TEC-001','BC-TEC-001','SN-TEC-001',
    c.id_categoria, te.id_tipo_equipo, m.id_marca, mo.id_modelo, col.id_color, es.id_estado, u.id_ubicacion,
    (SELECT id_equipo FROM public.equipos WHERE codigo_patrimonial='CPU-001'),
    'USB-A',
    '{"tipo_switch":"membrana","retroiluminacion":false,"inalambrico":false}'::jsonb,
    'OC-2024-003','Proveedor TI SAC',45.00,CURRENT_DATE,(CURRENT_DATE + INTERVAL '1 year')::date,
    usr.id_usuario,'Teclado vinculado a estación CPU-001'
FROM public.categorias c
JOIN public.tipos_equipo te ON te.id_categoria=c.id_categoria AND te.nombre='Membrana'
JOIN public.marcas m ON m.nombre='Logitech'
JOIN public.modelos mo ON mo.nombre='K120'
JOIN public.colores col ON col.nombre='Negro'
JOIN public.estados_operativos es ON es.nombre='Nuevo'
JOIN public.ubicaciones u ON u.area_departamento='Soporte TI'
JOIN public.usuarios usr ON usr.username='admin'
WHERE c.nombre='Teclado';

-- Parlantes (hijo)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    id_categoria, id_tipo_equipo, id_marca, id_modelo, id_color, id_estado, id_ubicacion_actual,
    id_equipo_padre, tipo_conexion, especificaciones_tecnicas,
    documento_compra_factura, proveedor, valor_compra, fecha_adquisicion, garantia_hasta,
    registrado_por, observaciones
)
SELECT
    'PAR-001','BC-PAR-001','SN-PAR-001',
    c.id_categoria, NULL, m.id_marca, mo.id_modelo, col.id_color, es.id_estado, u.id_ubicacion,
    (SELECT id_equipo FROM public.equipos WHERE codigo_patrimonial='CPU-001'),
    'Jack 3.5mm',
    '{"potencia_w":5,"conectividad":"cable 3.5mm","subwoofer":false}'::jsonb,
    'OC-2024-004','Proveedor TI SAC',60.00,CURRENT_DATE,(CURRENT_DATE + INTERVAL '1 year')::date,
    usr.id_usuario,'Parlantes vinculados a estación CPU-001'
FROM public.categorias c
JOIN public.marcas m ON m.nombre='Micronics'
JOIN public.modelos mo ON mo.nombre='SP-100'
JOIN public.colores col ON col.nombre='Negro'
JOIN public.estados_operativos es ON es.nombre='Nuevo'
JOIN public.ubicaciones u ON u.area_departamento='Soporte TI'
JOIN public.usuarios usr ON usr.username='admin'
WHERE c.nombre='Parlantes';

-- Audífonos (hijo)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    id_categoria, id_tipo_equipo, id_marca, id_modelo, id_color, id_estado, id_ubicacion_actual,
    id_equipo_padre, tipo_conexion, especificaciones_tecnicas,
    documento_compra_factura, proveedor, valor_compra, fecha_adquisicion, garantia_hasta,
    registrado_por, observaciones
)
SELECT
    'AUD-001','BC-AUD-001','SN-AUD-001',
    c.id_categoria, te.id_tipo_equipo, m.id_marca, mo.id_modelo, col.id_color, es.id_estado, u.id_ubicacion,
    (SELECT id_equipo FROM public.equipos WHERE codigo_patrimonial='CPU-001'),
    'Bluetooth',
    '{"tipo":"over-ear","microfono":true,"inalambrico":true,"conector":"USB-C"}'::jsonb,
    'OC-2024-005','Proveedor TI SAC',180.00,CURRENT_DATE,(CURRENT_DATE + INTERVAL '1 year')::date,
    usr.id_usuario,'Audífonos vinculados a estación CPU-001'
FROM public.categorias c
JOIN public.tipos_equipo te ON te.id_categoria=c.id_categoria AND te.nombre='Over-Ear USB'
JOIN public.marcas m ON m.nombre='Sony'
JOIN public.modelos mo ON mo.nombre='WH-CH520'
JOIN public.colores col ON col.nombre='Negro'
JOIN public.estados_operativos es ON es.nombre='Nuevo'
JOIN public.ubicaciones u ON u.area_departamento='Soporte TI'
JOIN public.usuarios usr ON usr.username='admin'
WHERE c.nombre='Audífonos';

-- Impresora independiente (con IP y MAC)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    id_categoria, id_tipo_equipo, id_marca, id_modelo, id_color, id_estado, id_ubicacion_actual,
    id_equipo_padre, tipo_conexion, direccion_mac, direccion_ip, especificaciones_tecnicas,
    documento_compra_factura, proveedor, valor_compra, fecha_adquisicion, garantia_hasta,
    registrado_por, observaciones
)
SELECT
    'IMP-001','BC-IMP-001','SN-IMP-001',
    c.id_categoria, te.id_tipo_equipo, m.id_marca, mo.id_modelo, col.id_color, es.id_estado, u.id_ubicacion,
    NULL,'RJ45 / Wi-Fi','AA:BB:CC:DD:EE:FF','192.168.1.100',
    '{"tipo_impresion":"tinta","velocidad_ppm":15,"multifuncional":true}'::jsonb,
    'OC-2024-006','Proveedor TI SAC',900.00,CURRENT_DATE,(CURRENT_DATE + INTERVAL '2 years')::date,
    usr.id_usuario,'Impresora de red - Área de Administración'
FROM public.categorias c
JOIN public.tipos_equipo te ON te.id_categoria=c.id_categoria AND te.nombre='Multifuncional Tinta'
JOIN public.marcas m ON m.nombre='Epson'
JOIN public.modelos mo ON mo.nombre='EcoTank L3250'
JOIN public.colores col ON col.nombre='Blanco'
JOIN public.estados_operativos es ON es.nombre='Nuevo'
JOIN public.ubicaciones u ON u.area_departamento='Administración'
JOIN public.usuarios usr ON usr.username='admin'
WHERE c.nombre='Impresora';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
