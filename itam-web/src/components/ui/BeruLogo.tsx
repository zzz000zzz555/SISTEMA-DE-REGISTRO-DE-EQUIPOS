import { Cpu } from "lucide-react";

export function BeruLogo({ size = "md", inverse = false }: { size?: "sm" | "md" | "lg"; inverse?: boolean }) {
  const dims = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  const brandText = inverse ? "text-white" : "text-slate-900 dark:text-slate-100";
  const badge = inverse
    ? "text-indigo-100 bg-white/10 border-white/15"
    : "text-indigo-600 bg-indigo-50 border-indigo-200";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${dims} rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md`}>
        <Cpu size={size === "sm" ? 16 : size === "lg" ? 24 : 18} className="text-white" strokeWidth={2} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`${text} font-extrabold tracking-tight ${brandText}`}>BERU</span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider rounded border px-1.5 py-0.5 ${badge}`}>Enterprise v2.5</span>
      </div>
    </div>
  );
}
