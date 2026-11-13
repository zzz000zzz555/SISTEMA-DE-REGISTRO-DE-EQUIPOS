import { createClient } from "./supabase/client";

export type AuthUser = {
  id_usuario: string;
  username: string;
  nombres: string;
  apellidos: string;
  correo_corporativo: string;
  id_rol: number;
  estado_cuenta: string;
};

export type AuthSession = {
  user: AuthUser;
  rol: { id_rol: number; nombre_rol: string; nivel_jerarquia: number };
  permisos: string[];
  id_sesion: string;
};

const KEY = "itam_session";

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(s: AuthSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export async function loginClient(identificador: string, password: string): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fn_autenticar_usuario", {
    p_identificador: identificador,
    p_password: password,
  });
  if (error) return { ok: false, message: error.message };
  const res = data as { ok: boolean; mensaje: string; usuario?: AuthUser; rol?: AuthSession["rol"]; permisos?: { codigo_permiso: string }[]; id_sesion?: string };
  if (!res.ok) return { ok: false, message: res.mensaje };
  const session: AuthSession = {
    user: res.usuario as AuthUser,
    rol: res.rol as AuthSession["rol"],
    permisos: (res.permisos ?? []).map((p) => p.codigo_permiso),
    id_sesion: res.id_sesion ?? "",
  };
  setSession(session);

  // Capturar IP publica + geolocalizacion + user agent (audit de sesion)
  try {
    const ipRes = await fetch("https://ipapi.co/json/");
    const ipData = await ipRes.json();
    const ua = navigator.userAgent;
    const soNav = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : "Otro";
    const nav = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Otro";
    await createClient().from("auditoria_sesiones").insert({
      id_usuario: (res.usuario as AuthUser).id_usuario,
      ip_publica: ipData.ip,
      ciudad: ipData.city,
      region: ipData.region,
      pais: ipData.country_name,
      latitud: ipData.latitude,
      longitud: ipData.longitude,
      user_agent: ua,
      so_navegador: soNav + " / " + nav,
      dispositivo: /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop",
      estado: "ACTIVA",
    });
  } catch (e) {
    // No bloquear login si falla la auditoria
  }

  return { ok: true, message: res.mensaje };
}

export async function logoutClient() {
  const s = getSession();
  if (s?.id_sesion) {
    const supabase = createClient();
    await supabase.from("sesiones_tokens").update({
      estado_sesion: "CERRADA",
      fecha_finalizacion: new Date().toISOString(),
      motivo_cierre: "Logout normal",
    }).eq("id_sesion", s.id_sesion);
  }
  clearSession();
}
