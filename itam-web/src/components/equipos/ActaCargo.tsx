"use client";

import { BeruLogo } from "@/components/ui/BeruLogo";
import type { InventarioView } from "@/lib/types";

export function ActaCargo({ parent, hijos, usuario }: { parent: InventarioView; hijos: InventarioView[]; usuario: string }) {
  function print() {
    const w = window.open("", "_blank");
    if (!w) return;
    const el = document.getElementById("acta-cargo");
    if (el) w.document.write(el.outerHTML);
    w.document.close();
    w.print();
  }

  const all = [parent, ...hijos];
  return (
    <div className="space-y-3">
      <div id="acta-cargo" className="bg-white p-8 max-w-3xl mx-auto border">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <BeruLogo size="md" />
          <div className="text-right">
            <div className="font-bold text-slate-800">ACTA DE ASIGNACIÓN / CARGO PATRIMONIAL</div>
            <div className="text-xs text-slate-500">N° ACTA-{parent.codigo_patrimonial} · {new Date().toLocaleString()}</div>
          </div>
        </div>
        <div className="mb-4 text-sm">
          <div><span className="font-semibold">Usuario responsable:</span> {usuario}</div>
          <div><span className="font-semibold">Ubicación:</span> {parent.area_departamento} — {parent.sede}</div>
          <div><span className="font-semibold">Estado:</span> {parent.estado}</div>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border px-2 py-1 text-left">Código Patrimonial</th>
              <th className="border px-2 py-1 text-left">Código Barras</th>
              <th className="border px-2 py-1 text-left">Categoría</th>
              <th className="border px-2 py-1 text-left">Marca / Modelo</th>
              <th className="border px-2 py-1 text-left">Color</th>
              <th className="border px-2 py-1 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {all.map((e) => (
              <tr key={e.id_equipo}>
                <td className="border px-2 py-1 font-mono">{e.codigo_patrimonial}</td>
                <td className="border px-2 py-1 font-mono">{e.codigo_barras}</td>
                <td className="border px-2 py-1">{e.categoria}</td>
                <td className="border px-2 py-1">{e.marca} {e.modelo ?? ""}</td>
                <td className="border px-2 py-1">{e.color}</td>
                <td className="border px-2 py-1">{e.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center">
            <div className="border-t border-slate-400 pt-2 text-xs">Firma Jefe de Patrimonio TI</div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-400 pt-2 text-xs">Firma Conformidad del Usuario</div>
          </div>
        </div>
        <div className="mt-6 text-[10px] text-slate-400 text-center">© 2026 BERU Systems — Plataforma de Auditoría y Activos TI</div>
      </div>
      <div className="flex justify-end">
        <button onClick={print} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Imprimir Acta</button>
      </div>
    </div>
  );
}