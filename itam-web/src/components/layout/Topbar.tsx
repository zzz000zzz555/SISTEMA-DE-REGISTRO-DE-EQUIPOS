import type { Usuario } from "@/lib/types";

export function Topbar({ user }: { user: Usuario }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="text-sm text-slate-600">
        <span className="font-semibold text-slate-800">Sede Central</span>
        <span className="mx-2 text-slate-300">|</span>
        Soporte TI
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-slate-800">{user.nombres} {user.apellidos}</div>
          <div className="text-xs text-slate-500">{user.correo_corporativo}</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
          {user.nombres[0]}{user.apellidos[0]}
        </div>
      </div>
    </header>
  );
}