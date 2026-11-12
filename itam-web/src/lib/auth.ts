"use server";

import { createAdminClient } from "./supabase/admin";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Usuario } from "./types";

export async function loginAction(username: string, password: string) {
  const admin = createAdminClient();
  const { data: user, error } = await admin
    .from("usuarios")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error || !user) {
    await logAudit("LOGIN_FAIL", null, null, "Usuario no encontrado: " + username);
    return { ok: false, message: "Credenciales inválidas" };
  }

  const u = user as Usuario;

  // vigencia contractual
  if (u.fecha_finalizacion && new Date(u.fecha_finalizacion) < new Date()) {
    return { ok: false, message: "Cuenta fuera de vigencia" };
  }
  if (u.estado_cuenta !== "ACTIVO") {
    return { ok: false, message: "Cuenta no activa (" + u.estado_cuenta + ")" };
  }

  // bloqueo
  if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) {
    return { ok: false, message: "Cuenta bloqueada hasta " + new Date(u.bloqueado_hasta).toLocaleString() };
  }

  const match = await bcrypt.compare(password, u.password_hash);
  if (!match) {
    const nuevos = (u.intentos_fallidos || 0) + 1;
    const update: Record<string, unknown> = { intentos_fallidos: nuevos };
    if (nuevos >= 5) {
      update.bloqueado_hasta = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      update.estado_cuenta = "BLOQUEADO";
    }
    await admin.from("usuarios").update(update).eq("id_usuario", u.id_usuario);
    await logAudit("LOGIN_FAIL", u.id_usuario, null, "Contraseña incorrecta (intento " + nuevos + ")");
    return { ok: false, message: "Credenciales inválidas" };
  }

  // reset intentos
  await admin.from("usuarios").update({ intentos_fallidos: 0, bloqueado_hasta: null, ultimo_acceso: new Date().toISOString() }).eq("id_usuario", u.id_usuario);

  // crear sesion token
  const ip = "127.0.0.1";
  const ua = "Web Client";
  const { data: sesion } = await admin
    .from("sesiones_tokens")
    .insert({
      id_usuario: u.id_usuario,
      token_hash: "tok_" + crypto.randomUUID(),
      refresh_token_hash: "ref_" + crypto.randomUUID(),
      ip_origen: ip,
      agente_navegador: ua,
      dispositivo: "Web Browser",
      estado_sesion: "ACTIVA",
      fecha_expiracion: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    })
    .select("id_sesion")
    .single();

  await logAudit("LOGIN_OK", u.id_usuario, sesion?.id_sesion ?? null, "Inicio de sesión exitoso");

  const cookieStore = await cookies();
  cookieStore.set("itam_session", u.id_usuario, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  cookieStore.set("itam_sesion_id", sesion?.id_sesion ?? "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return { ok: true, message: "OK" };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("itam_session")?.value;
  const sesionId = cookieStore.get("itam_sesion_id")?.value;
  const admin = createAdminClient();
  if (sesionId) {
    await admin.from("sesiones_tokens").update({
      estado_sesion: "CERRADA",
      fecha_finalizacion: new Date().toISOString(),
      motivo_cierre: "Logout normal",
    }).eq("id_sesion", sesionId);
  }
  if (userId) await logAudit("TOKEN_REVOCADO", userId, sesionId ?? null, "Cierre de sesión");
  cookieStore.delete("itam_session");
  cookieStore.delete("itam_sesion_id");
  redirect("/login");
}

export async function getCurrentUser(): Promise<Usuario | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("itam_session")?.value;
  if (!userId) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("usuarios").select("*").eq("id_usuario", userId).maybeSingle();
  return (data as Usuario) ?? null;
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("vista_permisos_usuario").select("codigo_permiso").eq("id_usuario", userId);
  return (data ?? []).map((r: { codigo_permiso: string }) => r.codigo_permiso);
}

async function logAudit(operacion: string, userId: string | null, sesionId: string | null, motivo: string) {
  const admin = createAdminClient();
  await admin.from("auditoria_sistema").insert({
    tabla_afectada: "usuarios",
    operacion,
    id_registro_afectado: userId ?? "n/a",
    id_usuario_ejecutor: userId,
    id_sesion: sesionId,
    ip_origen: "127.0.0.1",
    datos_nuevos: { motivo },
  });
}