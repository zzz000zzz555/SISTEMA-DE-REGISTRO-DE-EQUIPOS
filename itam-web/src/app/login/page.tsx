"use client";

import { useRef, useState } from "react";
import { loginClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, Lock, Eye, EyeOff } from "lucide-react";
import { BeruLogo } from "@/components/ui/BeruLogo";
import { withBase } from "@/lib/utils";

export default function LoginPage() {
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  // const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const username = userRef.current?.value ?? "";
    const password = passRef.current?.value ?? "";
    setLoading(true);
    setError("");
    const res = await loginClient(username, password);
    setLoading(false);
    if (res.ok) window.location.href = withBase("/dashboard/");
    else setError(res.message);
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10">
          <div className="mb-8"><BeruLogo size="lg" /></div>
          <h1 className="text-4xl font-bold leading-tight mb-4">BERU Enterprise</h1>
          <p className="text-indigo-200/80 text-lg max-w-md">Sistema Empresarial de Registro de Equipos, Control Patrimonial y Seguridad RBAC.</p>
        </div>
        <div className="relative z-10 flex items-center gap-4 text-xs text-indigo-300/70">
          <span>ISO 27001 Ready</span>
          <span>•</span>
          <span>Encriptación de Sesión</span>
          <span>•</span>
          <span>Control Patrimonial</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-3">
              <ShieldCheck size={22} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h2>
            <p className="text-slate-500 text-sm">Acceso al sistema BERU</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario o Correo</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={userRef}
                  type="text"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                  placeholder="admin"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={passRef}
                  type={showPwd ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-xs text-slate-500 mb-1 font-semibold">Medidas de seguridad activas</div>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• Contraseñas con mínimo 6 caracteres, letras, números y carácter especial</li>
              <li>• Bloqueo automático por 5 minutos tras 5 intentos fallidos</li>
              <li>• Sesión con token hasheado y registro forense de acceso</li>
              <li>• Validación de vigencia contractual del usuario</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}