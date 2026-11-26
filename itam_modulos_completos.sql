-- ============================================================================
-- MÓDULOS COMPLETOS: INFORMES, IP/SUBREDES, INVENTARIO EQUIPOS
-- Basado en los 3 archivos Excel de referencia
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- MÓDULO 1: INFORMES TÉCNICOS, MANTENIMIENTO Y ALMACÉN
-- ============================================================================

-- 1.1 Informes Técnicos
CREATE TABLE IF NOT EXISTS public.informes_tecnicos (
    id_informe UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_item SERIAL,
    codigo_patrimonial VARCHAR(50),
    sede VARCHAR(120) NOT NULL,
    centro_costo VARCHAR(120),
    ubicacion_fisica VARCHAR(150),
    denominacion VARCHAR(100) NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(150),
    serie VARCHAR(100),
    problema_reportado TEXT,
    diagnostico TEXT,
    estado_conservacion VARCHAR(20) CHECK (estado_conservacion IN ('BUENO','REGULAR','MALO')),
    pruebas_realizadas TEXT,
    observacion TEXT,
    baja_tecnica BOOLEAN DEFAULT false,
    fecha_alta DATE,
    garantia BOOLEAN DEFAULT false,
    tipo_mantenimiento VARCHAR(40) CHECK (tipo_mantenimiento IN ('PREVENTIVO','CORRECTIVO','PREVENTIVO Y CORRECTIVO')),
    estado_bien VARCHAR(20) CHECK (estado_bien IN ('OPERATIVO','INOPERATIVO','MALO')),
    responsable_evaluacion TEXT,
    fecha_ingreso DATE,
    fecha_evaluacion DATE,
    fecha_entrega DATE,
    numero_informe VARCHAR(50),
    creado_por UUID REFERENCES public.usuarios(id_usuario),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Mantenimientos (ya existe, agregar campos)
ALTER TABLE public.mantenimientos ADD COLUMN IF NOT EXISTS anydesk_teamviewer VARCHAR(50);
ALTER TABLE public.mantenimientos ADD COLUMN IF NOT EXISTS rustdesk VARCHAR(50);
ALTER TABLE public.mantenimientos ADD COLUMN IF NOT EXISTS contrasena_remota TEXT;
ALTER TABLE public.mantenimientos ADD COLUMN IF NOT EXISTS responsable_bien VARCHAR(120);
ALTER TABLE public.mantenimientos ADD COLUMN IF NOT EXISTS movil VARCHAR(30);
ALTER TABLE public.mantenimientos ADD COLUMN IF NOT EXISTS sugerencia_observacion TEXT;
ALTER TABLE public.mantenimientos ADD COLUMN IF NOT EXISTS solucion TEXT;
ALTER TABLE public.mantenimientos ADD COLUMN IF NOT EXISTS fecha_evaluacion DATE;
ALTER TABLE public.mantenimientos ADD COLUMN IF NOT EXISTS fecha_entrega_usuario DATE;

-- 1.3 Almacén de Cómputo
CREATE TABLE IF NOT EXISTS public.almacen_computo (
    id_almacen UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_item SERIAL,
    codigo_patrimonial VARCHAR(50),
    tipo_equipo VARCHAR(100) NOT NULL,
    sede_origen VARCHAR(120),
    centro_costo_origen VARCHAR(120),
    ubicacion_fisica_origen VARCHAR(150),
    numero_serie VARCHAR(100),
    modelo VARCHAR(150),
    marca VARCHAR(100),
    fecha_ingreso DATE NOT NULL,
    observacion_ingreso TEXT,
    estado_ingreso VARCHAR(20) CHECK (estado_ingreso IN ('OPERATIVO','INOPERATIVO','REGULAR','MALO')),
    responsable_registro_ingreso VARCHAR(120),
    sede_destino VARCHAR(120),
    centro_costo_destino VARCHAR(120),
    ubicacion_destino VARCHAR(150),
    fecha_salida DATE,
    estado_equipo_salida VARCHAR(20) CHECK (estado_equipo_salida IN ('OPERATIVO','INOPERATIVO')),
    responsable_recibe VARCHAR(120),
    documento_sustento VARCHAR(100),
    condicion_prestamo VARCHAR(20) CHECK (condicion_prestamo IN ('TEMPORAL','DEFINITIVO','CAMBIO','DEVUELTO')),
    responsable_registro_salida VARCHAR(120),
    observacion_salida TEXT,
    fecha_cierre_retorno DATE,
    creado_por UUID REFERENCES public.usuarios(id_usuario),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- MÓDULO 2: DIRECCIONAMIENTO IP, SUBREDES Y ACCESO REMOTO
-- ============================================================================

-- 2.1 Matriz de Subredes LAN
CREATE TABLE IF NOT EXISTS public.ip_inventario (
    id_ip UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INTEGER,
    subred_tab VARCHAR(20) NOT NULL CHECK (subred_tab IN ('IP0','IP1','IP2','IP3')),
    estado VARCHAR(20) NOT NULL DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE','OCUPADO','RESERVADO')),
    tipo_dispositivo VARCHAR(30) CHECK (tipo_dispositivo IN ('CPU','IMPRESORA','SERVIDOR','SWITCH','RELOJ BIOMETRICO','OTRO')),
    fisico_virtual VARCHAR(10) CHECK (fisico_virtual IN ('FISICO','VIRTUAL')),
    codigo_patrimonial VARCHAR(50),
    ubicacion VARCHAR(150),
    marca VARCHAR(100),
    nombre_equipo VARCHAR(100),
    usuario_windows VARCHAR(100),
    ip_completa VARCHAR(15) UNIQUE NOT NULL,
    octeto_1 SMALLINT NOT NULL DEFAULT 172,
    octeto_2 SMALLINT NOT NULL DEFAULT 16,
    octeto_3 SMALLINT NOT NULL,
    octeto_4 SMALLINT NOT NULL,
    actualizado BOOLEAN DEFAULT false,
    anydesk VARCHAR(50),
    rustdesk VARCHAR(50),
    clave_anydesk TEXT,
    personal_asignado VARCHAR(120),
    observacion TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (octeto_1, octeto_2, octeto_3, octeto_4)
);

-- 2.2 Distribución de Rangos IP
CREATE TABLE IF NOT EXISTS public.ip_rangos (
    id_rango UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloque_edificio VARCHAR(120) NOT NULL,
    area_oficina VARCHAR(120) NOT NULL,
    ip_inicio VARCHAR(15) NOT NULL,
    ip_fin VARCHAR(15) NOT NULL,
    cantidad_asignada INTEGER,
    detalle_equipos TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Red Periferia / PRONATEL
CREATE TABLE IF NOT EXISTS public.ip_pronatel (
    id_pronatel UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establecimiento_salud VARCHAR(150) NOT NULL,
    tipo_enlace VARCHAR(50) DEFAULT 'IP PRONATEL',
    ip_completa VARCHAR(15) NOT NULL,
    ip_oct1 SMALLINT, ip_oct2 SMALLINT, ip_oct3 SMALLINT, ip_oct4 SMALLINT,
    mascara_completa VARCHAR(15),
    mascara_oct1 SMALLINT, mascara_oct2 SMALLINT, mascara_oct3 SMALLINT, mascara_oct4 SMALLINT,
    puerta_enlace_completa VARCHAR(15),
    pg_oct1 SMALLINT, pg_oct2 SMALLINT, pg_oct3 SMALLINT, pg_oct4 SMALLINT,
    dns_primario VARCHAR(15),
    dns_secundario VARCHAR(15),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 Directorio AnyDesk Emergencia
CREATE TABLE IF NOT EXISTS public.anydesk_emergencia (
    id_anydesk UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INTEGER,
    tipo VARCHAR(30) DEFAULT 'CPU',
    codigo_patrimonial VARCHAR(50),
    ubicacion VARCHAR(150) NOT NULL,
    nombre_equipo VARCHAR(100),
    usuario_local VARCHAR(100),
    personal_responsable VARCHAR(120),
    anydesk_id VARCHAR(50) NOT NULL,
    estado_verificacion VARCHAR(20) DEFAULT 'POR VERIFICAR' CHECK (estado_verificacion IN ('VERIFICADO','POR VERIFICAR')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- MÓDULO 3: INVENTARIO GENERAL DE EQUIPOS (HH Y PERIFERIA)
-- ============================================================================

-- 3.1 Inventario de Monitores
CREATE TABLE IF NOT EXISTS public.inventario_monitores (
    id_monitor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambito VARCHAR(15) NOT NULL CHECK (ambito IN ('HH','PERIFERIE')),
    actualizado BOOLEAN DEFAULT false,
    item INTEGER,
    codigo_patrimonial VARCHAR(50),
    sede_red VARCHAR(120),
    centro_costo VARCHAR(120),
    ubicacion_fisica VARCHAR(150),
    marca VARCHAR(100),
    modelo VARCHAR(150),
    serie VARCHAR(100),
    resolucion VARCHAR(50),
    pulgadas VARCHAR(20),
    estado VARCHAR(20) CHECK (estado IN ('OPERATIVO','INOPERATIVO')),
    estado_conservacion VARCHAR(20) CHECK (estado_conservacion IN ('BUENO','REGULAR','MALO')),
    fecha_alta DATE,
    fecha_baja DATE,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.2 Inventario de Teclados
CREATE TABLE IF NOT EXISTS public.inventario_teclados (
    id_teclado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambito VARCHAR(15) NOT NULL CHECK (ambito IN ('HH','PERIFERIE')),
    actualizado BOOLEAN DEFAULT false,
    item INTEGER,
    codigo_patrimonial VARCHAR(50),
    sede VARCHAR(120),
    microred VARCHAR(120),
    centro_costo VARCHAR(120),
    eess VARCHAR(120),
    ubicacion_fisica VARCHAR(150),
    servicio VARCHAR(120),
    marca VARCHAR(100),
    modelo VARCHAR(150),
    serie VARCHAR(100),
    fecha_alta DATE,
    estado_conservacion VARCHAR(20) CHECK (estado_conservacion IN ('BUENO','REGULAR','MALO')),
    fecha_baja DATE,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.3 Inventario de Impresoras
CREATE TABLE IF NOT EXISTS public.inventario_impresoras (
    id_impresora UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambito VARCHAR(15) NOT NULL CHECK (ambito IN ('HH','PERIFERIE')),
    actualizado BOOLEAN DEFAULT false,
    item INTEGER,
    codigo_patrimonial VARCHAR(50),
    sede VARCHAR(120),
    centro_costo VARCHAR(120),
    ubicacion_fisica VARCHAR(150),
    marca VARCHAR(100),
    modelo VARCHAR(150),
    serie VARCHAR(100),
    tipo_impresora VARCHAR(50),
    insumo VARCHAR(20) CHECK (insumo IN ('TINTA','TONER','CINTA')),
    uso_insumos_mes VARCHAR(50),
    estado VARCHAR(20) CHECK (estado IN ('OPERATIVA','INOPERATIVA')),
    estado_conservacion VARCHAR(20) CHECK (estado_conservacion IN ('BUENO','REGULAR','MALO')),
    condicion_propiedad VARCHAR(30) CHECK (condicion_propiedad IN ('INSTITUCION','PROVEEDOR','PRONATEL')),
    fecha_garantia DATE,
    fecha_alta DATE,
    fecha_baja DATE,
    observacion TEXT,
    informe_tecnico VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.4 Inventario de Otros Equipos
CREATE TABLE IF NOT EXISTS public.inventario_otros (
    id_otros UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_patrimonial VARCHAR(50),
    tipo VARCHAR(50) NOT NULL,
    sede VARCHAR(120),
    centro_costo VARCHAR(120),
    ubicacion_fisica VARCHAR(150),
    marca VARCHAR(100),
    serie VARCHAR(100),
    modelo VARCHAR(150),
    observacion TEXT,
    fecha_alta DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ipinv_subred ON public.ip_inventario(subred_tab);
CREATE INDEX IF NOT EXISTS idx_ipinv_estado ON public.ip_inventario(estado);
CREATE INDEX IF NOT EXISTS idx_ipinv_ip ON public.ip_inventario(ip_completa);
CREATE INDEX IF NOT EXISTS idx_informes_sede ON public.informes_tecnicos(sede);
CREATE INDEX IF NOT EXISTS idx_informes_fecha ON public.informes_tecnicos(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_almacen_tipo ON public.almacen_computo(tipo_equipo);
CREATE INDEX IF NOT EXISTS idx_almacen_fecha ON public.almacen_computo(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_monitores_ambito ON public.inventario_monitores(ambito);
CREATE INDEX IF NOT EXISTS idx_teclados_ambito ON public.inventario_teclados(ambito);
CREATE INDEX IF NOT EXISTS idx_impresoras_ambito ON public.inventario_impresoras(ambito);

-- ============================================================================
-- SEED DATA: Generar hosts IP para subredes 0-3 (1..254)
-- ============================================================================
DO $$
DECLARE
    sn SMALLINT;
    host SMALLINT;
BEGIN
    FOR sn IN 0..3 LOOP
        FOR host IN 1..254 LOOP
            INSERT INTO public.ip_inventario (subred_tab, octeto_3, octeto_4, ip_completa, estado)
            VALUES ('IP' || sn, sn, host, '172.16.' || sn || '.' || host, 'LIBRE')
            ON CONFLICT (octeto_1, octeto_2, octeto_3, octeto_4) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- FIN
-- ============================================================================