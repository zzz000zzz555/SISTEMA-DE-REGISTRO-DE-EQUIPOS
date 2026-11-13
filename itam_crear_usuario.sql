CREATE OR REPLACE FUNCTION public.fn_crear_usuario(
  p_id_rol INTEGER,
  p_tipo_documento VARCHAR,
  p_numero_documento VARCHAR,
  p_nombres VARCHAR,
  p_apellidos VARCHAR,
  p_correo_corporativo VARCHAR,
  p_username VARCHAR,
  p_password TEXT,
  p_codigo_empleado VARCHAR DEFAULT NULL,
  p_telefono VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validaciones basicas
  IF p_username IS NULL OR length(trim(p_username)) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'mensaje', 'Username invalido (min 3 caracteres)');
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RETURN jsonb_build_object('ok', false, 'mensaje', 'Password invalido (min 6 caracteres)');
  END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE username = p_username) THEN
    RETURN jsonb_build_object('ok', false, 'mensaje', 'El username ya existe');
  END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE correo_corporativo = p_correo_corporativo) THEN
    RETURN jsonb_build_object('ok', false, 'mensaje', 'El correo ya existe');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE id_rol = p_id_rol) THEN
    RETURN jsonb_build_object('ok', false, 'mensaje', 'Rol invalido');
  END IF;

  INSERT INTO public.usuarios (
    id_rol, tipo_documento, numero_documento, codigo_empleado, nombres, apellidos,
    correo_corporativo, telefono, username, password_hash, requiere_cambio_clave,
    estado_cuenta, fecha_registro
  ) VALUES (
    p_id_rol, p_tipo_documento, p_numero_documento, p_codigo_empleado, p_nombres, p_apellidos,
    p_correo_corporativo, p_telefono, p_username,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    true, 'ACTIVO', now()
  ) RETURNING id_usuario INTO v_id;

  INSERT INTO public.auditoria_sistema (tabla_afectada, operacion, id_registro_afectado, id_usuario_ejecutor, datos_nuevos)
  VALUES ('usuarios', 'INSERT', v_id::text, v_id, jsonb_build_object('username', p_username, 'rol', p_id_rol));

  RETURN jsonb_build_object('ok', true, 'mensaje', 'Usuario creado exitosamente', 'id_usuario', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_crear_usuario TO anon;