"use client";

import { Monitor, Keyboard, Speaker, Headphones, Printer, Mouse } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { InventarioView } from "@/lib/types";

const iconMap: Record<string, LucideIcon> = {
  "Pantalla/Monitor": Monitor,
  Teclado: Keyboard,
  Parlantes: Speaker,
  Audífonos: Headphones,
  Mouse: Mouse,
  Impresora: Printer,
};

export function WorkstationTree({ parent, hijos, onUnlink }: { parent: InventarioView; hijos: InventarioView[]; onUnlink?: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
        <Monitor size={20} className="text-indigo-600" />
        <div>
          <div className="font-mono text-sm font-bold">{parent.codigo_patrimonial}</div>
          <div className="text-xs text-slate-500">{parent.marca} {parent.modelo} · {parent.estado}</div>
        </div>
      </div>
      <div className="pl-6 space-y-2 border-l-2 border-slate-200">
        {hijos.map((h) => {
          const Icon = iconMap[h.categoria ?? ""] ?? Monitor;
          return (
            <div key={h.id_equipo} className="flex items-center justify-between p-2 bg-white border rounded-lg">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-slate-500" />
                <div>
                  <div className="font-mono text-xs font-semibold">{h.codigo_patrimonial}</div>
                  <div className="text-xs text-slate-400">{h.categoria} · {h.marca} {h.modelo}</div>
                </div>
              </div>
              {onUnlink && (
                <button onClick={() => onUnlink(h.id_equipo)} className="text-xs text-red-600 hover:underline">Desvincular</button>
              )}
            </div>
          );
        })}
        {hijos.length === 0 && <div className="text-xs text-slate-400 italic">Sin periféricos vinculados</div>}
      </div>
    </div>
  );
}
