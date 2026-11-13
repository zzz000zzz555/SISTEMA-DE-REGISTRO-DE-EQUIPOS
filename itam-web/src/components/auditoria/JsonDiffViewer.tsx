"use client";

function diffKeys(oldObj: Record<string, unknown> | null, newObj: Record<string, unknown> | null): { key: string; oldVal: unknown; newVal: unknown; changed: boolean }[] {
  const keys = new Set([...Object.keys(oldObj ?? {}), ...Object.keys(newObj ?? {})]);
  return [...keys].map((k) => ({
    key: k,
    oldVal: oldObj?.[k],
    newVal: newObj?.[k],
    changed: JSON.stringify(oldObj?.[k]) !== JSON.stringify(newObj?.[k]),
  }));
}

export function JsonDiffViewer({ oldData, newData }: { oldData: Record<string, unknown> | null; newData: Record<string, unknown> | null }) {
  const rows = diffKeys(oldData, newData);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="text-sm font-semibold text-red-600 mb-2">Antes (OLD)</div>
        <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-xs font-mono space-y-1 max-h-96 overflow-auto">
          {rows.map((r) => (
            <div key={r.key} className={r.changed ? "bg-red-100 rounded px-1" : ""}>
              <span className="text-slate-500 dark:text-slate-400">{r.key}:</span>{" "}
              <span className={r.changed ? "text-red-700 font-semibold" : "text-slate-700 dark:text-slate-300"}>{JSON.stringify(r.oldVal)}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-emerald-600 mb-2">Después (NEW)</div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-xs font-mono space-y-1 max-h-96 overflow-auto">
          {rows.map((r) => (
            <div key={r.key} className={r.changed ? "bg-emerald-100 rounded px-1" : ""}>
              <span className="text-slate-500 dark:text-slate-400">{r.key}:</span>{" "}
              <span className={r.changed ? "text-emerald-700 font-semibold" : "text-slate-700 dark:text-slate-300"}>{JSON.stringify(r.newVal)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

