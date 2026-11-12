"use client";

import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { Modulo, Permiso } from "@/lib/types";

type Props = {
  modulos: Modulo[];
  permisos: Permiso[];
  selected: Set<number>;
  onChange: (s: Set<number>) => void;
  search: string;
};

export function PermissionTree({ modulos, permisos, selected, onChange, search }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set(modulos.map((m) => m.id_modulo)));

  const childrenOf = (id: number | null) =>
    modulos.filter((m) => m.id_modulo_padre === id);

  const permsOf = (mid: number) => permisos.filter((p) => p.id_modulo === mid);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  function togglePerm(pid: number) {
    const n = new Set(selected);
    if (n.has(pid)) n.delete(pid); else n.add(pid);
    onChange(n);
  }

  // module state: 0 none, 1 all, 2 partial
  function moduleState(mid: number): number {
    const ps = permsOf(mid);
    const childMods = childrenOf(mid);
    const allPermIds = [...ps.map((p) => p.id_permiso), ...childMods.flatMap((c) => collectPerms(c.id_modulo))];
    if (allPermIds.length === 0) return 0;
    const sel = allPermIds.filter((id) => selected.has(id)).length;
    if (sel === 0) return 0;
    if (sel === allPermIds.length) return 1;
    return 2;
  }

  function collectPerms(mid: number): number[] {
    const ps = permsOf(mid);
    const children = childrenOf(mid);
    return [...ps.map((p) => p.id_permiso), ...children.flatMap((c) => collectPerms(c.id_modulo))];
  }

  function toggleModule(mid: number) {
    const ids = collectPerms(mid);
    const st = moduleState(mid);
    const n = new Set(selected);
    if (st === 1) {
      ids.forEach((id) => n.delete(id));
    } else {
      ids.forEach((id) => n.add(id));
    }
    onChange(n);
  }

  function matchesSearch(m: Modulo): boolean {
    if (!search) return true;
    const q = search.toLowerCase();
    if (m.nombre_modulo.toLowerCase().includes(q)) return true;
    if (permsOf(m.id_modulo).some((p) => p.nombre_permiso.toLowerCase().includes(q) || p.codigo_permiso.toLowerCase().includes(q))) return true;
    return childrenOf(m.id_modulo).some(matchesSearch);
  }

  function renderModule(m: Modulo, depth: number) {
    if (!matchesSearch(m)) return null;
    const st = moduleState(m.id_modulo);
    const isExp = expanded.has(m.id_modulo);
    const children = childrenOf(m.id_modulo);
    const ps = permsOf(m.id_modulo).filter((p) =>
      !search || p.nombre_permiso.toLowerCase().includes(search.toLowerCase()) || p.codigo_permiso.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div key={m.id_modulo} className="select-none" style={{ paddingLeft: depth * 16 }}>
        <div className="flex items-center gap-2 py-1">
          <button onClick={() => toggleExpand(m.id_modulo)} className="text-slate-400">
            {children.length || ps.length ? (isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5" />}
          </button>
          <input
            type="checkbox"
            checked={st === 1}
            ref={(el) => { if (el) el.indeterminate = st === 2; }}
            onChange={() => toggleModule(m.id_modulo)}
            className="accent-purple-600"
          />
          <span className="font-semibold text-slate-700 text-sm">{m.nombre_modulo}</span>
        </div>
        {isExp && (
          <div>
            {ps.map((p) => (
              <div key={p.id_permiso} className="flex items-center gap-2 py-1" style={{ paddingLeft: 32 }}>
                <input
                  type="checkbox"
                  checked={selected.has(p.id_permiso)}
                  onChange={() => togglePerm(p.id_permiso)}
                  className="accent-purple-600"
                />
                <span className="text-sm text-slate-600">{p.nombre_permiso}</span>
                <span className="text-xs text-slate-400">({p.accion})</span>
              </div>
            ))}
            {children.map((c) => renderModule(c, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const roots = modulos.filter((m) => m.id_modulo_padre === null);

  return (
    <div className="border rounded-lg p-3 bg-slate-50">
      {roots.map((m) => renderModule(m, 0))}
    </div>
  );
}
