export type Rol = {
  id_rol: number;
  nombre_rol: string;
  descripcion: string | null;
  nivel_jerarquia: number;
  es_sistema: boolean;
  activo: boolean;
  fecha_registro: string;
  fecha_finalizacion: string | null;
};

export type Modulo = {
  id_modulo: number;
  id_modulo_padre: number | null;
  codigo_modulo: string;
  nombre_modulo: string;
  descripcion: string | null;
  ruta_endpoint: string | null;
  icono: string | null;
  orden_visual: number;
  activo: boolean;
  fecha_registro: string;
  fecha_finalizacion: string | null;
};

export type Permiso = {
  id_permiso: number;
  id_modulo: number;
  codigo_permiso: string;
  nombre_permiso: string;
  accion: string;
  descripcion: string | null;
  fecha_registro: string;
  fecha_finalizacion: string | null;
};

export type Usuario = {
  id_usuario: string;
  id_rol: number;
  tipo_documento: string;
  numero_documento: string;
  codigo_empleado: string | null;
  nombres: string;
  apellidos: string;
  correo_corporativo: string;
  telefono: string | null;
  username: string;
  password_hash: string;
  requiere_cambio_clave: boolean;
  intentos_fallidos: number;
  bloqueado_hasta: string | null;
  estado_cuenta: "ACTIVO" | "SUSPENDIDO" | "CESADO" | "BLOQUEADO";
  ultimo_acceso: string | null;
  fecha_registro: string;
  fecha_finalizacion: string | null;
  creado_por: string | null;
  updated_at: string;
};

export type PermisoUsuarioView = {
  id_usuario: string;
  username: string;
  correo_corporativo: string;
  estado_cuenta: string;
  id_rol: number;
  nombre_rol: string;
  nivel_jerarquia: number;
  id_permiso: number;
  codigo_permiso: string;
  nombre_permiso: string;
  accion: string;
  id_modulo: number;
  codigo_modulo: string;
  nombre_modulo: string;
  ruta_endpoint: string | null;
};

export type Categoria = {
  id_categoria: number;
  nombre: string;
  prefijo_codigo: string;
  esquema_atributos_sugerido: Record<string, unknown>;
  vida_util_anios: number;
  activo: boolean;
  fecha_registro: string;
  fecha_finalizacion: string | null;
};

export type Marca = { id_marca: number; nombre: string; activo: boolean; fecha_registro: string; fecha_finalizacion: string | null; };
export type Modelo = { id_modelo: number; id_marca: number; id_categoria: number; nombre: string; activo: boolean; fecha_registro: string; fecha_finalizacion: string | null; };
export type Color = { id_color: number; nombre: string; codigo_hex: string; fecha_registro: string; };
export type TipoEquipo = { id_tipo_equipo: number; id_categoria: number; nombre: string; activo: boolean; fecha_registro: string; fecha_finalizacion: string | null; };
export type EstadoOperativo = { id_estado: number; nombre: string; permite_asignacion: boolean; color_badge: string; fecha_registro: string; };
export type Ubicacion = { id_ubicacion: number; sede: string; area_departamento: string; piso_oficina: string | null; id_usuario_responsable: string | null; activo: boolean; fecha_registro: string; fecha_finalizacion: string | null; };

export type Equipo = {
  id_equipo: string;
  codigo_patrimonial: string;
  codigo_barras: string;
  numero_serie: string | null;
  id_categoria: number;
  id_tipo_equipo: number | null;
  id_marca: number;
  id_modelo: number | null;
  id_color: number | null;
  id_estado: number;
  id_ubicacion_actual: number;
  id_usuario_asignado: string | null;
  id_equipo_padre: string | null;
  tipo_conexion: string | null;
  direccion_mac: string | null;
  direccion_ip: string | null;
  especificaciones_tecnicas: Record<string, unknown>;
  documento_compra_factura: string | null;
  proveedor: string | null;
  valor_compra: number | null;
  fecha_adquisicion: string | null;
  garantia_hasta: string | null;
  fecha_registro: string;
  fecha_finalizacion: string | null;
  motivo_finalizacion: string | null;
  registrado_por: string;
  modificado_por: string | null;
  observaciones: string | null;
  updated_at: string;
};

export type InventarioView = Equipo & {
  categoria: string | null;
  categoria_prefijo: string | null;
  tipo_equipo: string | null;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  color_hex: string | null;
  estado: string | null;
  estado_permite_asignacion: boolean | null;
  estado_color_badge: string | null;
  sede: string | null;
  area_departamento: string | null;
  piso_oficina: string | null;
  usuario_asignado: string | null;
  registrado_por_nombre: string | null;
  equipo_padre_codigo_patrimonial: string | null;
};

export type SesionToken = {
  id_sesion: string;
  id_usuario: string;
  token_hash: string;
  refresh_token_hash: string | null;
  ip_origen: string;
  agente_navegador: string | null;
  dispositivo: string | null;
  estado_sesion: "ACTIVA" | "CERRADA" | "EXPIRADA" | "REVOCADA_ADMIN";
  fecha_registro: string;
  fecha_expiracion: string;
  fecha_finalizacion: string | null;
  motivo_cierre: string | null;
};

export type Auditoria = {
  id_auditoria: string;
  tabla_afectada: string;
  operacion: string;
  id_registro_afectado: string;
  id_usuario_ejecutor: string | null;
  id_sesion: string | null;
  ip_origen: string | null;
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  fecha_registro: string;
};
