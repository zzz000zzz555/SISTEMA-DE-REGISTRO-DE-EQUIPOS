import Image from "next/image";

export function BeruLogo({ size = "md", inverse = false }: { size?: "sm" | "md" | "lg"; inverse?: boolean }) {
  const dims = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-9 h-9";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${dims} relative flex items-center justify-center`}>
        <img src="/beru-logo.png" alt="BERU" className="w-full h-full object-contain logo-no-bg" />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`${text} font-extrabold tracking-tight ${inverse ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>BERU</span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 ${inverse ? "text-indigo-200 bg-white/10 border border-white/20" : "text-indigo-600 bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"}`}>Enterprise v2.5</span>
      </div>
    </div>
  );
}
