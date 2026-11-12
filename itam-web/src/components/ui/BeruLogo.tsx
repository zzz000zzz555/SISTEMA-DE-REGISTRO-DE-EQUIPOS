import { Cpu } from "lucide-react";

export function BeruLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${dims} rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md`}>
        <Cpu size={size === "sm" ? 16 : size === "lg" ? 24 : 18} className="text-white" strokeWidth={2} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`${text} font-extrabold tracking-tight text-slate-900`}>BERU</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">Enterprise v2.5</span>
      </div>
    </div>
  );
}