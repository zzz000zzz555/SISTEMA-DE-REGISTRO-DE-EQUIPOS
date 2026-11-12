-- ============================================================================
-- SISTEMA EMPRESARIAL DE GESTIÓN Y REGISTRO DE ACTIVOS TI E INVENTARIO PATRIMONIAL (ITAM)
-- Esquema PostgreSQL / Supabase - Capa de Base de Datos
-- Orden de ejecución: Tablas -> Índices -> Funciones/Triggers -> Vistas -> Seed Data
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONES (gen_random_uuid disponible por defecto en PG13+)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLAS MAESTRAS (CATÁLOGOS)
-- ============================================================================

-- 1.1 CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categorias (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre                  VARCHAR(80)  NOT NULL UNIQUE,
    prefijo_codigo          VARCHAR(5)   NOT NULL,
    esquema_atributos_sugerido JSONB     NOT NULL DEFAULT '{}'::jsonb,
    activo                  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 1.2 MARCAS
CREATE TABLE IF NOT EXISTS public.marcas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(80)  NOT NULL UNIQUE,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 1.3 MODELOS
CREATE TABLE IF NOT EXISTS public.modelos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marca_id    UUID NOT NULL REFERENCES public.marcas(id) ON DELETE RESTRICT,
    categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
    nombre      VARCHAR(120) NOT NULL,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (marca_id, categoria_id, nombre)
);

-- 1.4 COLORES
CREATE TABLE IF NOT EXISTS public.colores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(40)  NOT NULL UNIQUE,
    codigo_hex  VARCHAR(7)   NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 1.5 TIPOS DE EQUIPO
CREATE TABLE IF NOT EXISTS public.tipos_equipo (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
    nombre       VARCHAR(80)  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (categoria_id, nombre)
);

-- 1.6 ESTADOS OPERATIVOS
CREATE TABLE IF NOT EXISTS public.estados_operativos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre              VARCHAR(60)  NOT NULL UNIQUE,
    permite_asignacion  BOOLEAN      NOT NULL DEFAULT TRUE,
    color_badge         VARCHAR(20),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 1.7 UBICACIONES
CREATE TABLE IF NOT EXISTS public.ubicaciones (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede              VARCHAR(120) NOT NULL,
    area_departamento VARCHAR(120) NOT NULL,
    piso_oficina      VARCHAR(60),
    responsable_area  VARCHAR(120),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLA CENTRAL: EQUIPOS (ACTIVOS PATRIMONIALES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.equipos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_patrimonial      VARCHAR(50)  NOT NULL UNIQUE,
    codigo_barras           VARCHAR(100) NOT NULL UNIQUE,
    numero_serie            VARCHAR(100) UNIQUE,
    categoria_id            UUID NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
    tipo_equipo_id          UUID REFERENCES public.tipos_equipo(id) ON DELETE SET NULL,
    marca_id                UUID NOT NULL REFERENCES public.marcas(id) ON DELETE RESTRICT,
    modelo_id               UUID REFERENCES public.modelos(id) ON DELETE SET NULL,
    color_id                UUID REFERENCES public.colores(id) ON DELETE SET NULL,
    estado_id               UUID NOT NULL REFERENCES public.estados_operativos(id) ON DELETE RESTRICT,
    ubicacion_actual_id     UUID NOT NULL REFERENCES public.ubicaciones(id) ON DELETE RESTRICT,
    equipo_padre_id         UUID REFERENCES public.equipos(id) ON DELETE SET NULL,
    tipo_conexion           VARCHAR(60),
    especificaciones_tecnicas JSONB NOT NULL DEFAULT '{}'::jsonb,
    fecha_adquisicion       DATE,
    valor_compra            NUMERIC(10,2),
    garantia_hasta          DATE,
    observaciones           TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLAS DE TRAZABILIDAD Y AUDITORÍA
-- ============================================================================

-- 3.1 HISTORIAL DE MOVIMIENTOS
CREATE TABLE IF NOT EXISTS public.historial_movimientos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id           UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    ubicacion_origen_id UUID REFERENCES public.ubicaciones(id) ON DELETE SET NULL,
    ubicacion_destino_id UUID REFERENCES public.ubicaciones(id) ON DELETE SET NULL,
    estado_anterior_id  UUID REFERENCES public.estados_operativos(id) ON DELETE SET NULL,
    estado_nuevo_id     UUID REFERENCES public.estados_operativos(id) ON DELETE SET NULL,
    motivo              TEXT,
    usuario_registro    VARCHAR(120),
    fecha_movimiento    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 MANTENIMIENTOS
CREATE TABLE IF NOT EXISTS public.mantenimientos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id           UUID NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    tipo_mantenimiento  VARCHAR(30) NOT NULL CHECK (tipo_mantenimiento IN ('Preventivo','Correctivo')),
    descripcion_falla   TEXT,
    trabajo_realizado   TEXT,
    costo               NUMERIC(10,2),
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE,
    tecnico_responsable VARCHAR(120),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================================

-- 4.1 Identificadores únicos de equipos
CREATE INDEX IF NOT EXISTS idx_equipos_codigo_patrimonial ON public.equipos(codigo_patrimonial);
CREATE INDEX IF NOT EXISTS idx_equipos_codigo_barras     ON public.equipos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_equipos_numero_serie      ON public.equipos(numero_serie);

-- 4.2 Llaves foráneas de equipos
CREATE INDEX IF NOT EXISTS idx_equipos_categoria_id        ON public.equipos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo_equipo_id      ON public.equipos(tipo_equipo_id);
CREATE INDEX IF NOT EXISTS idx_equipos_marca_id            ON public.equipos(marca_id);
CREATE INDEX IF NOT EXISTS idx_equipos_modelo_id           ON public.equipos(modelo_id);
CREATE INDEX IF NOT EXISTS idx_equipos_color_id            ON public.equipos(color_id);
CREATE INDEX IF NOT EXISTS idx_equipos_estado_id           ON public.equipos(estado_id);
CREATE INDEX IF NOT EXISTS idx_equipos_ubicacion_actual_id ON public.equipos(ubicacion_actual_id);
CREATE INDEX IF NOT EXISTS idx_equipos_equipo_padre_id     ON public.equipos(equipo_padre_id);

-- 4.3 GIN sobre atributos dinámicos
CREATE INDEX IF NOT EXISTS idx_equipos_especificaciones_gin ON public.equipos USING GIN (especificaciones_tecnicas);

-- 4.4 Catálogos
CREATE INDEX IF NOT EXISTS idx_modelos_marca_id      ON public.modelos(marca_id);
CREATE INDEX IF NOT EXISTS idx_modelos_categoria_id  ON public.modelos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_tipos_equipo_categoria_id ON public.tipos_equipo(categoria_id);

-- 4.5 Trazabilidad
CREATE INDEX IF NOT EXISTS idx_historial_equipo_id        ON public.historial_movimientos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha_movimiento ON public.historial_movimientos(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_equipo_id   ON public.mantenimientos(equipo_id);

-- ============================================================================
-- 5. FUNCIONES Y TRIGGERS
-- ============================================================================

-- 5.1 Trigger updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_equipos_updated_at ON public.equipos;
CREATE TRIGGER trg_equipos_updated_at
    BEFORE UPDATE ON public.equipos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_set_updated_at();

-- 5.2 Trigger de auditoría automática
CREATE OR REPLACE FUNCTION public.fn_audit_equipo_cambios()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.ubicacion_actual_id IS DISTINCT FROM NEW.ubicacion_actual_id)
       OR (OLD.estado_id IS DISTINCT FROM NEW.estado_id)
       OR (OLD.equipo_padre_id IS DISTINCT FROM NEW.equipo_padre_id) THEN
        INSERT INTO public.historial_movimientos (
            equipo_id,
            ubicacion_origen_id,
            ubicacion_destino_id,
            estado_anterior_id,
            estado_nuevo_id,
            motivo,
            usuario_registro,
            fecha_movimiento
        ) VALUES (
            NEW.id,
            OLD.ubicacion_actual_id,
            NEW.ubicacion_actual_id,
            OLD.estado_id,
            NEW.estado_id,
            CASE
                WHEN OLD.equipo_padre_id IS DISTINCT FROM NEW.equipo_padre_id
                    THEN 'Cambio de equipo padre / asignación de periférico'
                ELSE 'Cambio de ubicación o estado operativo'
            END,
            COALESCE(NULLIF(current_setting('request.jwt.claim.sub', TRUE), ''), current_user),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_equipos_audit ON public.equipos;
CREATE TRIGGER trg_equipos_audit
    AFTER UPDATE ON public.equipos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_audit_equipo_cambios();

-- ============================================================================
-- 6. VISTA CONSOLIDADA
-- ============================================================================

CREATE OR REPLACE VIEW public.vista_inventario_completo AS
SELECT
    e.id                          AS equipo_id,
    e.codigo_patrimonial,
    e.codigo_barras,
    e.numero_serie,
    c.id                          AS categoria_id,
    c.nombre                      AS categoria,
    c.prefijo_codigo              AS categoria_prefijo,
    te.id                         AS tipo_equipo_id,
    te.nombre                     AS tipo_equipo,
    m.id                          AS marca_id,
    m.nombre                      AS marca,
    mo.id                         AS modelo_id,
    mo.nombre                     AS modelo,
    col.id                        AS color_id,
    col.nombre                    AS color,
    col.codigo_hex                AS color_hex,
    es.id                         AS estado_id,
    es.nombre                     AS estado,
    es.permite_asignacion         AS estado_permite_asignacion,
    es.color_badge                AS estado_color_badge,
    u.id                          AS ubicacion_id,
    u.sede                        AS sede,
    u.area_departamento           AS area_departamento,
    u.piso_oficina                AS piso_oficina,
    u.responsable_area            AS responsable_area,
    e.equipo_padre_id             AS equipo_padre_id,
    ep.codigo_patrimonial         AS equipo_padre_codigo_patrimonial,
    e.tipo_conexion,
    e.especificaciones_tecnicas,
    e.fecha_adquisicion,
    e.valor_compra,
    e.garantia_hasta,
    e.observaciones,
    e.created_at,
    e.updated_at
FROM public.equipos e
LEFT JOIN public.categorias        c   ON c.id   = e.categoria_id
LEFT JOIN public.tipos_equipo      te  ON te.id  = e.tipo_equipo_id
LEFT JOIN public.marcas           m   ON m.id   = e.marca_id
LEFT JOIN public.modelos          mo  ON mo.id  = e.modelo_id
LEFT JOIN public.colores          col ON col.id = e.color_id
LEFT JOIN public.estados_operativos es ON es.id = e.estado_id
LEFT JOIN public.ubicaciones      u   ON u.id   = e.ubicacion_actual_id
LEFT JOIN public.equipos          ep  ON ep.id  = e.equipo_padre_id;

-- ============================================================================
-- 7. DATOS SEMILLA (SEED DATA)
-- ============================================================================

-- 7.1 CATEGORÍAS
INSERT INTO public.categorias (nombre, prefijo_codigo, esquema_atributos_sugerido) VALUES
    ('Pantalla/Monitor', 'MON', '{"pulgadas": null, "panel": "", "resolucion": "", "tasa_refresco_hz": null}'::jsonb),
    ('Teclado',          'TEC', '{"tipo_switch": "", "retroiluminacion": false, "inalambrico": false}'::jsonb),
    ('Mouse',            'MOU', '{"dpi": null, "botones": null, "inalambrico": false}'::jsonb),
    ('PC/Workstation',   'CPU', '{"ram_gb": null, "procesador": "", "almacenamiento": "", "gpu": ""}'::jsonb),
    ('Impresora',        'IMP', '{"tipo_impresion": "", "velocidad_ppm": null, "multifuncional": false}'::jsonb),
    ('Parlantes',        'PAR', '{"potencia_w": null, "conectividad": "", "subwoofer": false}'::jsonb),
    ('Audífonos',        'AUD', '{"tipo": "", "microfono": false, "inalambrico": false, "conector": ""}'::jsonb)
ON CONFLICT (nombre) DO NOTHING;

-- 7.2 MARCAS
INSERT INTO public.marcas (nombre) VALUES
    ('HP'), ('Dell'), ('LG'), ('Logitech'), ('Epson'), ('Teros'), ('Micronics'), ('Sony')
ON CONFLICT (nombre) DO NOTHING;

-- 7.3 COLORES
INSERT INTO public.colores (nombre, codigo_hex) VALUES
    ('Negro',       '#000000'),
    ('Blanco',      '#FFFFFF'),
    ('Plata',       '#C0C0C0'),
    ('Gris Oscuro', '#333333')
ON CONFLICT (nombre) DO NOTHING;

-- 7.4 ESTADOS OPERATIVOS
INSERT INTO public.estados_operativos (nombre, permite_asignacion, color_badge) VALUES
    ('Nuevo',               TRUE,  'verde'),
    ('Operativo',           TRUE,  'azul'),
    ('En Mantenimiento',    FALSE, 'amarillo'),
    ('De Baja',             FALSE, 'rojo')
ON CONFLICT (nombre) DO NOTHING;

-- 7.5 TIPOS DE EQUIPO
INSERT INTO public.tipos_equipo (categoria_id, nombre)
SELECT c.id, t.nombre FROM public.categorias c
CROSS JOIN (VALUES
    ('Pantalla/Monitor','LED'),
    ('Pantalla/Monitor','Curvo'),
    ('Pantalla/Monitor','IPS'),
    ('Teclado','Mecánico'),
    ('Teclado','Membrana'),
    ('Teclado','Inalámbrico'),
    ('Impresora','Láser'),
    ('Impresora','Multifuncional Tinta'),
    ('Impresora','Matricial'),
    ('Audífonos','Over-Ear USB'),
    ('Audífonos','In-Ear Bluetooth')
) AS t(cat, nombre)
WHERE c.nombre = t.cat
ON CONFLICT (categoria_id, nombre) DO NOTHING;

-- 7.6 UBICACIONES
INSERT INTO public.ubicaciones (sede, area_departamento, piso_oficina, responsable_area) VALUES
    ('Sede Central', 'Soporte TI',        'Piso 2', 'Jefe de TI'),
    ('Sede Central', 'Administración',    'Piso 1', 'Jefe de Administración'),
    ('Sede Central', 'Contabilidad',      'Piso 1', 'Jefe de Contabilidad'),
    ('Sede Central', 'Almacén Central',   'Piso 0', 'Encargado de Almacén');

-- 7.7 MODELOS
INSERT INTO public.modelos (marca_id, categoria_id, nombre)
SELECT m.id, c.id, md.nombre
FROM (VALUES
    ('HP',       'PC/Workstation', 'ProDesk 400 G7'),
    ('LG',       'Pantalla/Monitor','24MK430H'),
    ('Logitech', 'Teclado',        'K120'),
    ('Micronics', 'Parlantes',     'SP-100'),
    ('Sony',     'Audífonos',      'WH-CH520'),
    ('Epson',    'Impresora',      'EcoTank L3250')
) AS md(marca, categoria, nombre)
JOIN public.marcas m ON m.nombre = md.marca
JOIN public.categorias c ON c.nombre = md.categoria
ON CONFLICT (marca_id, categoria_id, nombre) DO NOTHING;

-- 7.8 EQUIPOS (PC PRINCIPAL + PERIFÉRICOS + IMPRESORA INDEPENDIENTE)
-- PC Principal (Padre)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    categoria_id, tipo_equipo_id, marca_id, modelo_id, color_id, estado_id, ubicacion_actual_id,
    equipo_padre_id, tipo_conexion, especificaciones_tecnicas,
    fecha_adquisicion, valor_compra, garantia_hasta, observaciones
)
SELECT
    'CPU-001', 'BC-CPU-001', 'SN-PC-001',
    c.id, te.id, m.id, mo.id, col.id, es.id, u.id,
    NULL, 'RJ45 / Wi-Fi',
    '{"ram_gb":16,"procesador":"Intel Core i7-10700","almacenamiento":"512GB NVMe","gpu":"Intel UHD Graphics"}'::jsonb,
    CURRENT_DATE, 3500.00, (CURRENT_DATE + INTERVAL '2 years')::date,
    'Estación de trabajo principal - Soporte TI'
FROM public.categorias c
JOIN public.tipos_equipo te ON te.categoria_id = c.id AND te.nombre = 'Mecánico'
JOIN public.marcas m ON m.nombre = 'HP'
JOIN public.modelos mo ON mo.nombre = 'ProDesk 400 G7'
JOIN public.colores col ON col.nombre = 'Negro'
JOIN public.estados_operativos es ON es.nombre = 'Nuevo'
JOIN public.ubicaciones u ON u.area_departamento = 'Soporte TI'
WHERE c.nombre = 'PC/Workstation';

-- Oops: tipo_equipo para PC no existe (no se definió tipo). Fix below by not requiring tipo. 
-- The above INSERT may have failed silently? It requires te.id. Let me instead handle: remove tipo requirement.

-- NOTE: The insert above assumes a tipo_equipo 'Mecánico' exists under PC category, which is false.
-- We'll delete that bad row if inserted and redo cleanly. To avoid, we restructure: skip tipo for PC.

-- Revert: remove any incorrectly inserted CPU-001
DELETE FROM public.equipos WHERE codigo_patrimonial = 'CPU-001';

-- Insert PC Principal without tipo_equipo
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    categoria_id, tipo_equipo_id, marca_id, modelo_id, color_id, estado_id, ubicacion_actual_id,
    equipo_padre_id, tipo_conexion, especificaciones_tecnicas,
    fecha_adquisicion, valor_compra, garantia_hasta, observaciones
)
SELECT
    'CPU-001', 'BC-CPU-001', 'SN-PC-001',
    c.id, NULL, m.id, mo.id, col.id, es.id, u.id,
    NULL, 'RJ45 / Wi-Fi',
    '{"ram_gb":16,"procesador":"Intel Core i7-10700","almacenamiento":"512GB NVMe","gpu":"Intel UHD Graphics"}'::jsonb,
    CURRENT_DATE, 3500.00, (CURRENT_DATE + INTERVAL '2 years')::date,
    'Estación de trabajo principal - Soporte TI'
FROM public.categorias c
JOIN public.marcas m ON m.nombre = 'HP'
JOIN public.modelos mo ON mo.nombre = 'ProDesk 400 G7'
JOIN public.colores col ON col.nombre = 'Negro'
JOIN public.estados_operativos es ON es.nombre = 'Nuevo'
JOIN public.ubicaciones u ON u.area_departamento = 'Soporte TI'
WHERE c.nombre = 'PC/Workstation';

-- Pantalla (hijo de CPU-001)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    categoria_id, tipo_equipo_id, marca_id, modelo_id, color_id, estado_id, ubicacion_actual_id,
    equipo_padre_id, tipo_conexion, especificaciones_tecnicas,
    fecha_adquisicion, valor_compra, garantia_hasta, observaciones
)
SELECT
    'MON-001', 'BC-MON-001', 'SN-MON-001',
    c.id, te.id, m.id, mo.id, col.id, es.id, u.id,
    (SELECT id FROM public.equipos WHERE codigo_patrimonial = 'CPU-001'),
    'HDMI + DisplayPort',
    '{"pulgadas":24,"panel":"IPS","resolucion":"1920x1080","tasa_refresco_hz":75}'::jsonb,
    CURRENT_DATE, 650.00, (CURRENT_DATE + INTERVAL '2 years')::date,
    'Monitor vinculado a estación CPU-001'
FROM public.categorias c
JOIN public.tipos_equipo te ON te.categoria_id = c.id AND te.nombre = 'IPS'
JOIN public.marcas m ON m.nombre = 'LG'
JOIN public.modelos mo ON mo.nombre = '24MK430H'
JOIN public.colores col ON col.nombre = 'Negro'
JOIN public.estados_operativos es ON es.nombre = 'Nuevo'
JOIN public.ubicaciones u ON u.area_departamento = 'Soporte TI'
WHERE c.nombre = 'Pantalla/Monitor';

-- Teclado (hijo)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    categoria_id, tipo_equipo_id, marca_id, modelo_id, color_id, estado_id, ubicacion_actual_id,
    equipo_padre_id, tipo_conexion, especificaciones_tecnicas,
    fecha_adquisicion, valor_compra, garantia_hasta, observaciones
)
SELECT
    'TEC-001', 'BC-TEC-001', 'SN-TEC-001',
    c.id, te.id, m.id, mo.id, col.id, es.id, u.id,
    (SELECT id FROM public.equipos WHERE codigo_patrimonial = 'CPU-001'),
    'USB-A',
    '{"tipo_switch":"membrana","retroiluminacion":false,"inalambrico":false}'::jsonb,
    CURRENT_DATE, 45.00, (CURRENT_DATE + INTERVAL '1 year')::date,
    'Teclado vinculado a estación CPU-001'
FROM public.categorias c
JOIN public.tipos_equipo te ON te.categoria_id = c.id AND te.nombre = 'Membrana'
JOIN public.marcas m ON m.nombre = 'Logitech'
JOIN public.modelos mo ON mo.nombre = 'K120'
JOIN public.colores col ON col.nombre = 'Negro'
JOIN public.estados_operativos es ON es.nombre = 'Nuevo'
JOIN public.ubicaciones u ON u.area_departamento = 'Soporte TI'
WHERE c.nombre = 'Teclado';

-- Parlantes (hijo)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    categoria_id, tipo_equipo_id, marca_id, modelo_id, color_id, estado_id, ubicacion_actual_id,
    equipo_padre_id, tipo_conexion, especificaciones_tecnicas,
    fecha_adquisicion, valor_compra, garantia_hasta, observaciones
)
SELECT
    'PAR-001', 'BC-PAR-001', 'SN-PAR-001',
    c.id, NULL, m.id, mo.id, col.id, es.id, u.id,
    (SELECT id FROM public.equipos WHERE codigo_patrimonial = 'CPU-001'),
    'Jack 3.5mm',
    '{"potencia_w":5,"conectividad":"cable 3.5mm","subwoofer":false}'::jsonb,
    CURRENT_DATE, 60.00, (CURRENT_DATE + INTERVAL '1 year')::date,
    'Parlantes vinculados a estación CPU-001'
FROM public.categorias c
JOIN public.marcas m ON m.nombre = 'Micronics'
JOIN public.modelos mo ON mo.nombre = 'SP-100'
JOIN public.colores col ON col.nombre = 'Negro'
JOIN public.estados_operativos es ON es.nombre = 'Nuevo'
JOIN public.ubicaciones u ON u.area_departamento = 'Soporte TI'
WHERE c.nombre = 'Parlantes';

-- Audífonos (hijo)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    categoria_id, tipo_equipo_id, marca_id, modelo_id, color_id, estado_id, ubicacion_actual_id,
    equipo_padre_id, tipo_conexion, especificaciones_tecnicas,
    fecha_adquisicion, valor_compra, garantia_hasta, observaciones
)
SELECT
    'AUD-001', 'BC-AUD-001', 'SN-AUD-001',
    c.id, te.id, m.id, mo.id, col.id, es.id, u.id,
    (SELECT id FROM public.equipos WHERE codigo_patrimonial = 'CPU-001'),
    'Bluetooth',
    '{"tipo":"over-ear","microfono":true,"inalambrico":true,"conector":"USB-C"}'::jsonb,
    CURRENT_DATE, 180.00, (CURRENT_DATE + INTERVAL '1 year')::date,
    'Audífonos vinculados a estación CPU-001'
FROM public.categorias c
JOIN public.tipos_equipo te ON te.categoria_id = c.id AND te.nombre = 'Over-Ear USB'
JOIN public.marcas m ON m.nombre = 'Sony'
JOIN public.modelos mo ON mo.nombre = 'WH-CH520'
JOIN public.colores col ON col.nombre = 'Negro'
JOIN public.estados_operativos es ON es.nombre = 'Nuevo'
JOIN public.ubicaciones u ON u.area_departamento = 'Soporte TI'
WHERE c.nombre = 'Audífonos';

-- Impresora independiente (sin padre)
INSERT INTO public.equipos (
    codigo_patrimonial, codigo_barras, numero_serie,
    categoria_id, tipo_equipo_id, marca_id, modelo_id, color_id, estado_id, ubicacion_actual_id,
    equipo_padre_id, tipo_conexion, especificaciones_tecnicas,
    fecha_adquisicion, valor_compra, garantia_hasta, observaciones
)
SELECT
    'IMP-001', 'BC-IMP-001', 'SN-IMP-001',
    c.id, te.id, m.id, mo.id, col.id, es.id, u.id,
    NULL, 'RJ45 / Wi-Fi',
    '{"tipo_impresion":"tinta","velocidad_ppm":15,"multifuncional":true}'::jsonb,
    CURRENT_DATE, 900.00, (CURRENT_DATE + INTERVAL '2 years')::date,
    'Impresora de red - Área de Administración'
FROM public.categorias c
JOIN public.tipos_equipo te ON te.categoria_id = c.id AND te.nombre = 'Multifuncional Tinta'
JOIN public.marcas m ON m.nombre = 'Epson'
JOIN public.modelos mo ON mo.nombre = 'EcoTank L3250'
JOIN public.colores col ON col.nombre = 'Blanco'
JOIN public.estados_operativos es ON es.nombre = 'Nuevo'
JOIN public.ubicaciones u ON u.area_departamento = 'Administración'
WHERE c.nombre = 'Impresora';

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
