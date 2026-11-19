"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { loginClient } from "@/lib/auth-client";
import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { BeruLogo } from "@/components/ui/BeruLogo";

export default function LoginPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await loginClient(username, password);
    setLoading(false);
    if (res.ok) window.location.href = "/SISTEMA-DE-REGISTRO-DE-EQUIPOS/dashboard/";
    else setError(res.message);
  }

  const isDark = resolvedTheme === "dark";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative isolate flex min-h-[360px] flex-col overflow-hidden bg-slate-950 px-6 py-7 text-white sm:min-h-[400px] sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 size-[28rem] rounded-full bg-indigo-600/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-24 size-[30rem] rounded-full bg-violet-700/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <BeruLogo size="md" inverse />
          <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300 sm:inline-flex">
            Gestión empresarial
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-xl py-10 lg:py-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-xs font-medium text-indigo-100">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Plataforma de activos TI
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Todo tu inventario,
            <br className="hidden sm:block" /> bajo control.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            Equipos, mantenimiento y control patrimonial en un solo espacio de trabajo seguro.
          </p>

          <div className="mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Monitor, label: "Inventario", detail: "Activos centralizados" },
              { icon: ClipboardCheck, label: "Mantenimiento", detail: "Seguimiento claro" },
              { icon: Activity, label: "Auditoría", detail: "Actividad registrada" },
            ].map(({ icon: Icon, label, detail }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-3 sm:block sm:p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-200">
                  <Icon size={17} strokeWidth={1.8} />
                </div>
                <div className="sm:mt-4">
                  <div className="text-xs font-semibold text-white">{label}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} className="text-indigo-300" />
          Acceso protegido por roles y permisos
        </div>
      </section>

      <section className="relative flex min-h-[620px] items-center justify-center overflow-hidden px-5 py-12 dark:bg-slate-950 sm:px-8 lg:min-h-screen lg:px-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-0 size-80 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-950/30" />

        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="absolute right-5 top-5 z-10 inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white sm:right-8 sm:top-8"
          title="Cambiar tema"
          aria-label="Cambiar tema"
        >
          <Sun size={17} className="hidden dark:block" />
          <Moon size={17} className="block dark:hidden" />
        </button>

        <div className="relative z-10 w-full max-w-md glass-card rounded-3xl p-6 sm:p-9 animate-scale-in">
          <div className="mb-8">
            <div className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <ShieldCheck size={21} strokeWidth={1.8} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
              Portal BERU
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[1.75rem]">
              Inicia sesión
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Usuario o correo
              </label>
              <div className="relative">
                <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="Tu usuario o correo"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((visible) => !visible)}
                  className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPwd}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
              Seguridad activa
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              <li>Contraseñas protegidas y bloqueo tras intentos fallidos.</li>
              <li>Registro de sesiones y validación de vigencia de cuenta.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

