-- ============================================================================
-- FUNCION RPC DE AUTENTICACION PARA FRONTEND ESTATICO (GITHUB PAGES)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Funcion de autenticacion SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.fn_autenticar_usuario(p_identificador TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user RECORD;
  v_rol RECORD;
  v_permisos JSONB;
  v_sesion_id UUID;
  v_minutos INTEGER;
BEGIN
  -- Buscar usuario por username o correo
  SELECT * INTO v_user
  FROM public.usuarios
  WHERE (username = p_identificador OR correo_corporativo = p_identificador)
  LIMIT 1;

  IF v_user IS NULL THEN
    INSERT INTO public.auditoria_sistema (tabla_afectada, operacion, id_registro_afectado, ip_origen, datos_nuevos)
    VALUES ('usuarios', 'LOGIN_FAIL', 'n/a', 'frontend', jsonb_build_object('motivo', 'Usuario no encontrado', 'identificador', p_identificador));
    RETURN jsonb_build_object('ok', false, 'mensaje', 'Credenciales inválidas');
  END IF;

  -- Vigencia contractual
  IF v_user.estado_cuenta <> 'ACTIVO' THEN
    RETURN jsonb_build_object('ok', false, 'mensaje', 'Cuenta no activa (' || v_user.estado_cuenta || ')');
  END IF;
  IF v_user.fecha_finalizacion IS NOT NULL AND v_user.fecha_finalizacion <= now() THEN
    RETURN jsonb_build_object('ok', false, 'mensaje', 'Cuenta fuera de vigencia');
  END IF;

  -- Bloqueo por fuerza bruta
  IF v_user.bloqueado_hasta IS NOT NULL AND v_user.bloqueado_hasta > now() THEN
    v_minutos := CEIL(EXTRACT(EPOCH FROM (v_user.bloqueado_hasta - now())) / 60.0)::INTEGER;
    RETURN jsonb_build_object('ok', false, 'mensaje', 'Cuenta bloqueada. Intente en ' || v_minutos || ' minuto(s).', 'bloqueado_hasta', v_user.bloqueado_hasta);
  END IF;

  -- Verificar password: soporta texto plano (pruebas) y hash crypt() de pgcrypto
  IF NOT (v_user.password_hash = p_password OR v_user.password_hash = extensions.crypt(p_password, v_user.password_hash)) THEN
    -- Incrementar intentos fallidos
    UPDATE public.usuarios
    SET intentos_fallidos = COALESCE(intentos_fallidos, 0) + 1,
        bloqueado_hasta = CASE WHEN COALESCE(intentos_fallidos, 0) + 1 >= 5 THEN now() + interval '5 minutes' ELSE bloqueado_hasta END,
        estado_cuenta = CASE WHEN COALESCE(intentos_fallidos, 0) + 1 >= 5 THEN 'BLOQUEADO' ELSE estado_cuenta END
    WHERE id_usuario = v_user.id_usuario;

    INSERT INTO public.auditoria_sistema (tabla_afectada, operacion, id_registro_afectado, id_usuario_ejecutor, ip_origen, datos_nuevos)
    VALUES ('usuarios', 'LOGIN_FAIL', v_user.id_usuario::text, v_user.id_usuario, 'frontend', jsonb_build_object('motivo', 'Contraseña incorrecta', 'intentos', COALESCE(v_user.intentos_fallidos,0)+1));

    IF COALESCE(v_user.intentos_fallidos, 0) + 1 >= 5 THEN
      RETURN jsonb_build_object('ok', false, 'mensaje', 'Cuenta bloqueada por 5 minutos tras 5 intentos fallidos.');
    END IF;
    RETURN jsonb_build_object('ok', false, 'mensaje', 'Credenciales inválidas');
  END IF;

  -- Login exitoso: reset intentos, actualizar ultimo_acceso
  UPDATE public.usuarios
  SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = now()
  WHERE id_usuario = v_user.id_usuario;

  -- Obtener rol
  SELECT * INTO v_rol FROM public.roles WHERE id_rol = v_user.id_rol;

  -- Permisos activos
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id_permiso', p.id_permiso,
    'codigo_permiso', p.codigo_permiso,
    'nombre_permiso', p.nombre_permiso,
    'accion', p.accion,
    'id_modulo', p.id_modulo,
    'codigo_modulo', m.codigo_modulo,
    'nombre_modulo', m.nombre_modulo,
    'ruta_endpoint', m.ruta_endpoint
  )), '[]'::jsonb) INTO v_permisos
  FROM public.permisos p
  JOIN public.modulos_sistema m ON m.id_modulo = p.id_modulo
  JOIN public.roles_permisos rp ON rp.id_permiso = p.id_permiso
  WHERE rp.id_rol = v_user.id_rol
    AND rp.activo = true
    AND (rp.fecha_finalizacion IS NULL OR rp.fecha_finalizacion > now())
    AND m.activo = true
    AND (m.fecha_finalizacion IS NULL OR m.fecha_finalizacion > now());

  -- Crear sesion token
  INSERT INTO public.sesiones_tokens (id_usuario, token_hash, refresh_token_hash, ip_origen, agente_navegador, dispositivo, estado_sesion, fecha_expiracion)
  VALUES (v_user.id_usuario, 'tok_' || gen_random_uuid()::text, 'ref_' || gen_random_uuid()::text, 'frontend', 'Web Browser', 'Web', 'ACTIVA', now() + interval '8 hours')
  RETURNING id_sesion INTO v_sesion_id;

  INSERT INTO public.auditoria_sistema (tabla_afectada, operacion, id_registro_afectado, id_usuario_ejecutor, id_sesion, ip_origen, datos_nuevos)
  VALUES ('usuarios', 'LOGIN_OK', v_user.id_usuario::text, v_user.id_usuario, v_sesion_id, 'frontend', jsonb_build_object('motivo', 'Inicio de sesión exitoso'));

  RETURN jsonb_build_object(
    'ok', true,
    'mensaje', 'Login exitoso',
    'usuario', jsonb_build_object(
      'id_usuario', v_user.id_usuario,
      'username', v_user.username,
      'nombres', v_user.nombres,
      'apellidos', v_user.apellidos,
      'correo_corporativo', v_user.correo_corporativo,
      'id_rol', v_user.id_rol,
      'estado_cuenta', v_user.estado_cuenta
    ),
    'rol', jsonb_build_object(
      'id_rol', v_rol.id_rol,
      'nombre_rol', v_rol.nombre_rol,
      'nivel_jerarquia', v_rol.nivel_jerarquia
    ),
    'permisos', v_permisos,
    'id_sesion', v_sesion_id
  );
END;
$$;

-- Garantizar usuario admin con credenciales conocidas
-- Actualizar si existe, insertar si no
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE username = 'admin') THEN
    UPDATE public.usuarios
    SET correo_corporativo = 'admin@sistema.com',
        password_hash = extensions.crypt('Admin@123', extensions.gen_salt('bf')),
        estado_cuenta = 'ACTIVO',
        fecha_finalizacion = NULL,
        intentos_fallidos = 0,
        bloqueado_hasta = NULL,
        id_rol = (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Super Administrador' LIMIT 1)
    WHERE username = 'admin';
  ELSE
    INSERT INTO public.usuarios (id_rol, tipo_documento, numero_documento, nombres, apellidos, correo_corporativo, username, password_hash, estado_cuenta, fecha_registro)
    VALUES (
      (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Super Administrador' LIMIT 1),
      'DNI', '00000001', 'Admin', 'Sistema', 'admin@sistema.com', 'admin',
      extensions.crypt('Admin@123', extensions.gen_salt('bf')), 'ACTIVO', now()
    );
  END IF;

  -- Usuario Beru
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE username = 'Beru') THEN
    UPDATE public.usuarios
    SET correo_corporativo = 'beru@sistema.com',
        password_hash = extensions.crypt('mapachesymapaches', extensions.gen_salt('bf')),
        estado_cuenta = 'ACTIVO',
        fecha_finalizacion = NULL,
        intentos_fallidos = 0,
        bloqueado_hasta = NULL
    WHERE username = 'Beru';
  ELSE
    INSERT INTO public.usuarios (id_rol, tipo_documento, numero_documento, nombres, apellidos, correo_corporativo, username, password_hash, estado_cuenta, fecha_registro)
    VALUES (
      (SELECT id_rol FROM public.roles WHERE nombre_rol = 'Soporte Técnico' LIMIT 1),
      'DNI', '99999999', 'Beru', 'Usuario', 'beru@sistema.com', 'Beru',
      extensions.crypt('mapachesymapaches', extensions.gen_salt('bf')), 'ACTIVO', now()
    );
  END IF;
END $$;

-- Verificacion de prueba
SELECT public.fn_autenticar_usuario('admin', 'Admin@123') AS resultado_admin;