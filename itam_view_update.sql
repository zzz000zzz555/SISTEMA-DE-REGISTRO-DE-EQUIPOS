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
    e.especificaciones_tecnicas->>'procesador' AS procesador,
    (e.especificaciones_tecnicas->>'ram_gb')::numeric AS ram_gb,
    e.especificaciones_tecnicas->>'almacenamiento' AS disco_duro,

    e.especificaciones_tecnicas->>'sistema_operativo' AS sistema_operativo,
    (e.especificaciones_tecnicas->>'bits')::integer AS bits,
    (e.especificaciones_tecnicas->>'cpu_ghz')::numeric AS cpu_ghz,
    e.centro_costo,
    e.anydesk,
    e.rustdesk,
    e.nombre_equipo,
    e.tipo_ram,
    e.tipo_disco,
    e.estado_disco,
    e.fecha_donacion,
    e.fecha_alta,
    e.fecha_repotechnacion,
    e.fecha_baja,
    e.dominio,
    e.condicion_propiedad,
    e.informacion_tecnico,
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